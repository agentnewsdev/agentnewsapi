const { Connection, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL, sendAndConfirmTransaction } = require('@solana/web3.js');
const bs58 = require('bs58').default || require('bs58');
const { AgentNewsClient } = require('./index.js');

async function testOnboarding() {
    const rpcUrl = process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');
    const privateKeyBase58 = process.env.PRIVATE_KEY;
    if (!privateKeyBase58) {
        console.error('[TEST] Error: PRIVATE_KEY environment variable is required.');
        process.exit(1);
    }
    const hotWallet = '6rSLPtj9Ef7aifNHHFzEPkY5hWECJXryivWx1YhPuXSa';
    
    const secretKey = bs58.decode(privateKeyBase58);
    const keypair = Keypair.fromSecretKey(secretKey);
    
    console.log(`[TEST] Wallet: ${keypair.publicKey.toBase58()}`);
    
    // 1. Check Balance
    const balance = await connection.getBalance(keypair.publicKey);
    console.log(`[TEST] Current Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    
    if (balance < 0.001 * LAMPORTS_PER_SOL) {
        throw new Error('Insufficient balance to send 0.001 SOL');
    }

    // 2. Transfer 0.001 SOL (SKIPPING since already sent in previous run)
    /*
    console.log(`[TEST] Sending 0.001 SOL to ${hotWallet}...`);
    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: keypair.publicKey,
            toPubkey: hotWallet,
            lamports: 0.001 * LAMPORTS_PER_SOL,
        })
    );

    const signature = await sendAndConfirmTransaction(connection, transaction, [keypair]);
    console.log(`[TEST] Transaction Success! Signature: ${signature}`);
    console.log(`[TEST] View on Solscan: https://solscan.io/tx/${signature}`);
    */
    console.log('[TEST] Skipping SOL transfer (already sent).');

    // 3. Initialize Agent News Client
    console.log('[TEST] Initializing Agent News Client (Mainnet)...');
    const client = new AgentNewsClient({
        privateKey: privateKeyBase58,
        apiUrl: 'https://agentnewsapi.com'
    });

    try {
        await client.connect();
        console.log('[TEST] Connection established.');

        // 4. Poll for Credits
        console.log('[TEST] Waiting for credits to be detected (polling UI/API)...');
        let credits = 0;
        let attempts = 0;
        while (credits <= 0 && attempts < 10) {
            credits = await client.getCreditBalance();
            console.log(`[TEST] Current Credits: ${credits} (Attempt ${attempts + 1}/10)`);
            if (credits > 0) break;
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
        }

        if (credits <= 0) {
            console.warn('[TEST] Credits not detected yet. Continuing to test API calls anyway...');
        }

        // 5. Test API
        console.log('[TEST] Fetching latest signals...');
        const signals = await client.getLatestSignals({ limit: 5 });
        console.log(`[TEST] Received ${signals.length} signals.`);
        if (signals.length > 0) {
            console.log('[TEST] Latest Signal:', signals[0].narrative?.title || 'No Title');
        }

        // 6. Test WebSocket
        console.log('[TEST] Waiting for WebSocket signal event (10s timeout)...');
        client.on('signal', (data) => {
            console.log('[TEST] WS SIGNAL RECEIVED:', data.narrative?.title || 'New Data');
            client.disconnect();
            process.exit(0);
        });

        setTimeout(() => {
            console.log('[TEST] WS Timeout. No signal received in 10s.');
            client.disconnect();
            process.exit(0);
        }, 15000);

    } catch (error) {
        console.error(`[TEST] ERROR: ${error.message}`);
        process.exit(1);
    }
}

testOnboarding();
