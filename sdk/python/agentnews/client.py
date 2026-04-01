import socketio
import requests
import base58
import nacl.signing
import traceback

class AgentNewsClient:
    def __init__(self, api_key=None, private_key_base58=None, api_url='https://api.agentnewsapi.com'):
        """
        Initialize the internal connection for the global news firehose.
        :param api_key: The string API key to use.
        :param private_key_base58: Standard 64-byte Ed25519 solar format base58 private key.
        :param api_url: Backend API url.
        """
        self.api_key = api_key
        self.private_key_base58 = private_key_base58
        self.api_url = api_url
        self.sio = socketio.Client()
        self.is_connected = False
        self.credit_balance = None
        
        # Event callbacks
        self.handlers = {}

        self._setup_socket_events()

    def on(self, event_name, handler):
        if event_name not in self.handlers:
            self.handlers[event_name] = []
        self.handlers[event_name].append(handler)

    def emit_local(self, event_name, data=None):
        for handler in self.handlers.get(event_name, []):
            handler(data) if data is not None else handler()

    def connect(self):
        if not self.api_key:
            if not self.private_key_base58:
                raise ValueError("Must provide either an api_key or private_key_base58 for Zero-HITL auth.")
            print("[AGENT NEWS] No API key provided. Initiating Zero-HITL Authentication via Solana...")
            self.api_key = self._authenticate_with_solana()
            print("[AGENT NEWS] Zero-HITL Auth Successful. API Key acquired.")

        self._initialize_websocket()

    def disconnect(self):
        if self.is_connected:
            self.sio.disconnect()
            self.is_connected = False

    def get_latest_signals(self, limit=20, q=None):
        self._ensure_authenticated()
        try:
            params = {'limit': limit}
            if q:
                params['q'] = q

            res = requests.get(
                f"{self.api_url}/api/news/latest",
                headers={'X-API-KEY': self.api_key},
                params=params
            )
            res.raise_for_status()
            return res.json().get('articles', [])
        except Exception as e:
            raise Exception(f"Failed to fetch latest signals: {e}")

    def get_free_signals(self, limit=20, q=None):
        """
        Fetch delayed curated signals from the REST API (FREE TIER).
        Subject to a 20-minute delay and 1 request per minute rate limit.
        Does NOT require authentication — unauthenticated requests are rate-limited by IP.
        """
        try:
            params = {'limit': limit}
            if q:
                params['q'] = q

            headers = {}
            if self.api_key:
                headers['X-API-KEY'] = self.api_key

            res = requests.get(
                f"{self.api_url}/api/news/free",
                headers=headers,
                params=params
            )
            res.raise_for_status()
            return res.json().get('articles', [])
        except Exception as e:
            if hasattr(e, 'response') and e.response is not None and e.response.status_code == 429:
                data = e.response.json()
                raise Exception(f"Rate limit exceeded: {data.get('message')}")
            raise Exception(f"Failed to fetch free signals: {e}")

    def get_credit_balance(self):
        self._ensure_authenticated()
        try:
            res = requests.get(
                f"{self.api_url}/api/users/me",
                headers={'X-API-KEY': self.api_key}
            )
            res.raise_for_status()
            data = res.json()
            self.credit_balance = data.get('user', {}).get('apiCredits', 0)
            return self.credit_balance
        except Exception as e:
            raise Exception(f"Failed to fetch balance: {e}")

    def _authenticate_with_solana(self):
        try:
            # 1. Decode base58 solana secret key
            secret_key_bytes = base58.b58decode(self.private_key_base58)
            if len(secret_key_bytes) != 64:
                raise ValueError("Invalid private key length. Expected 64 bytes.")
            
            # Use the first 32 bytes as seed to the signing key
            signing_key = nacl.signing.SigningKey(secret_key_bytes[:32])
            verify_key = signing_key.verify_key
            wallet_address = base58.b58encode(verify_key.encode()).decode('utf-8')

            # 2. Sign auth message
            message = "Allow Agent News API Access"
            message_bytes = message.encode('utf-8')
            signed = signing_key.sign(message_bytes)
            signature_b58 = base58.b58encode(signed.signature).decode('utf-8')

            # 3. Request API Key
            res = requests.post(f"{self.api_url}/api/keys/autonomous", json={
                "walletAddress": wallet_address,
                "signature": signature_b58,
                "message": message
            })
            res.raise_for_status()
            data = res.json()
            if not data.get("success") or not data.get("apiKey"):
                raise ValueError("Server rejected Zero-HITL auth.")

            return data.get("apiKey")
        except Exception as e:
            raise Exception(f"Zero-HITL Auth Failed: {e}")

    def _setup_socket_events(self):
        @self.sio.event
        def connect():
            self.is_connected = True
            self.emit_local('connected')

        @self.sio.event
        def news_update(data):
            if '_meta' in data and 'remainingCredits' in data['_meta']:
                self.credit_balance = data['_meta']['remainingCredits']
            self.emit_local('signal', data)

        @self.sio.event
        def balance_update(data):
            self.credit_balance = data.get('credits')
            self.emit_local('balance', self.credit_balance)

        @self.sio.event
        def connect_error(err):
            self.is_connected = False
            self.emit_local('error', err)

        @self.sio.event
        def disconnect():
            self.is_connected = False
            self.emit_local('disconnected')

    def _initialize_websocket(self):
        try:
            self.sio.connect(self.api_url, auth={'apiKey': self.api_key})
        except Exception as e:
            raise Exception(f"Failed to connect WebSocket: {e}")

    def _ensure_authenticated(self):
        if not self.api_key:
            raise Exception("Client not authenticated. Call connect() first or provide an API key.")
