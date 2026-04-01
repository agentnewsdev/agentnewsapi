const { AgentNewsClient } = require('../index');
const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58').default || require('bs58');

// --- SETUP FOR EXAMPLE ---
// In production, an agent would normally load its private key securely
// For this demo, we generate a fresh one and log it so you can fund it with devnet $SOL
const demoKeypair = Keypair.generate();
const agentPrivateKeyStr = bs58.encode(demoKeypair.secretKey);
const agentPublicKeyStr = demoKeypair.publicKey.toBase58();

console.log('🤖 Starting Autonomous Trading Agent...');
console.log('🔑 Agent Public Key:', agentPublicKeyStr);
console.log('--------------------------------------------------');

// --- SDK INITIALIZATION ---
// Initialize the client with the agent's private key
// The SDK automatically handles the zero-HITL auth to get an API Key
const client = new AgentNewsClient({
    privateKey: agentPrivateKeyStr,
    apiUrl: 'http://localhost:3001' // Change to https://api.agentnewsapi.com for production
});

// --- EVENT LISTENERS ---

// 1. Connection Event
client.on('connected', async () => {
    console.log('✅ Connected to Agent News Global Signal Firehose');
    
    try {
        const balance = await client.getCreditBalance();
        console.log(`💰 Current Credit Balance: ${balance} SOL`);
        
        if (balance === 0) {
            console.log(`\n⚠️  WARNING: Credit balance is 0.`);
            console.log(`Please send a tiny amount of SOL (e.g., 0.01) to:`);
            console.log(`>> ${agentPublicKeyStr} <<`);
            console.log(`The deposit will be automatically identified and credited.\n`);
        }
    } catch (err) {
        console.error('Failed to get balance:', err.message);
    }
});

// 2. The Core Value: Listening to Live Signals
client.on('signal', (signal) => {
    console.log('\n🚨 NEW GLOBAL SIGNAL INGESTED 🚨');
    console.log(`Title: ${signal.title}`);
    console.log(`Significance Score: ${signal.significance?.score}/100`);
    console.log(`Sentiment: ${signal.sentiment?.label} (${signal.sentiment?.score})`);
    
    // --- AUTONOMOUS LOGIC EXAMPLE ---
    if (signal.significance?.score > 90) {
        console.log('>> HIGH SIGNIFICANCE DETECTED. Executing macro trading strategy...');
        // executeTrade(signal);
    }
    
    // Log the cost of this signal processing
    if (signal._meta) {
        console.log(`\n[Billing] This signal cost ${signal._meta.cost} SOL.`);
        console.log(`[Billing] Remaining Balance: ${signal._meta.remainingCredits} SOL`);
    }
});

// 3. Balance Updates (Fired when deposits occur or credits are used)
client.on('balance', (newBalance) => {
    console.log(`\n💳 Balance Updated: ${newBalance} SOL remaining.`);
});

// 4. Error Handling
client.on('error', (err) => {
    if (err.code === 'INSUFFICIENT_CREDITS') {
        console.error('\n❌ STREAM PAUSED: Insufficient Credits.');
        console.error(`Please fund: ${agentPublicKeyStr}`);
    } else {
        console.error('WebSocket Error:', err.message);
    }
});

// --- START THE AGENT ---
console.log('Connecting to Agent News API...');
client.connect().catch(err => {
    console.error('Failed to start agent:', err.message);
    console.error('Ensure the Agent News API server is running locally on port 3001.');
});
