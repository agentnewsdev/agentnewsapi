from agentnews import AgentNewsClient
import nacl.signing
import base58
import time

# --- SETUP FOR EXAMPLE ---
# In production, load your secure private key.
# For demo, generate a fresh keypair and display it.
signing_key = nacl.signing.SigningKey.generate()
# Solana private keys are 64 bytes (32 byte secret + 32 byte public)
secret_key_bytes = signing_key.encode() + signing_key.verify_key.encode()
agent_private_key_str = base58.b58encode(secret_key_bytes).decode('utf-8')
agent_public_key_str = base58.b58encode(signing_key.verify_key.encode()).decode('utf-8')

print("🤖 Starting Autonomous Python Trading Agent...")
print(f"🔑 Agent Public Key: {agent_public_key_str}")
print("-" * 50)

# --- SDK INITIALIZATION ---
client = AgentNewsClient(
    private_key_base58=agent_private_key_str,
    api_url='http://localhost:3001' # Change to https://api.agentnewsapi.com for production
)

# --- EVENT HANDLERS ---
def on_connect():
    print("✅ Connected to Agent News Global Signal Firehose")
    try:
        balance = client.get_credit_balance()
        print(f"💰 Current Credit Balance: {balance} SOL")
        if balance == 0:
            print("\n⚠️ WARNING: Credit balance is 0.")
            print("Please send a tiny amount of SOL (e.g., 0.01) to:")
            print(f">> {agent_public_key_str} <<")
            print("The deposit will be automatically identified and credited.\n")
    except Exception as e:
        print(f"Failed to get balance: {e}")

def on_signal(signal):
    print("\n🚨 NEW GLOBAL SIGNAL INGESTED 🚨")
    print(f"Title: {signal.get('title')}")
    sig_score = signal.get('significance', {}).get('score')
    print(f"Significance Score: {sig_score}/100")
    sentiment = signal.get('sentiment', {})
    print(f"Sentiment: {sentiment.get('label')} ({sentiment.get('score')})")
    
    if sig_score and sig_score > 90:
        print(">> HIGH SIGNIFICANCE DETECTED. Executing macro trading strategy...")
    
    meta = signal.get('_meta')
    if meta:
        print(f"\n[Billing] This signal cost {meta.get('cost')} SOL.")
        print(f"[Billing] Remaining Balance: {meta.get('remainingCredits')} SOL")

def on_balance(new_balance):
    print(f"\n💳 Balance Updated: {new_balance} SOL remaining.")

def on_error(err):
    print(f"Error occurred: {err}")

# Wiring up events
client.on('connected', on_connect)
client.on('signal', on_signal)
client.on('balance', on_balance)
client.on('error', on_error)

# --- START THE AGENT ---
print("Connecting to Agent News API...")
try:
    client.connect()
    # Wait continuously
    while True:
         time.sleep(1)
except Exception as e:
    print(f"Failed to start agent: {e}")
    print("Ensure the Agent News API server is running.")
