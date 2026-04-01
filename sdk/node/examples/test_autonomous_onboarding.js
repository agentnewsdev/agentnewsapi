/**
 * Agent News - Autonomous Onboarding Test Suite (Production)
 * 
 * This script demonstrates the "Zero-HITL" onboarding process for autonomous agents.
 * 1. Registers the agent using the Solana keypair.
 * 2. Checks for on-chain SOL balance.
 * 3. Autonomously transfers SOL to the services hot wallet to acquire API credits.
 * 4. Connects via WebSocket and REST to fetch signals.
 */

const { AgentNewsClient } = require('../index');
const { Keypair, Connection, Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey } = require('@solana/web3.js');
const bs58Raw = require('bs58');
const bs58 = bs58Raw.default || bs58Raw;
require('dotenv').config();

// Configuration
const API_URL = process.env.API_URL || 'https://agentnewsapi.com';
const HOT_WALLET_ADDRESS = '6rSLPtj9Ef7aifNHHFzEPkY5hWECJXryivWx1YhPuXSa';
const RPC_URL = 'https://api.mainnet-beta.solana.com';

async function runTest() {
    console.log('--- [AGENT NEWS] Autonomous Onboarding & Funding Test ---');

    if (!process.env.PRIVATE_KEY) {
        console.error('❌ Error: PRIVATE_KEY environment variable is required.');
        process.exit(1);
    }

    const secretKey = bs58.decode(process.env.PRIVATE_KEY);
    const keypair = Keypair.fromSecretKey(secretKey);
    const walletAddress = keypair.publicKey.toBase58();
    console.log(`Agent Wallet: ${walletAddress}`);

    const client = new AgentNewsClient({
        privateKey: process.env.PRIVATE_KEY,
        apiUrl: API_URL
    });

    // Add error handler to prevent crash on insufficient credits
    client.on('error', (err) => {
        if (err.code === 'INSUFFICIENT_CREDITS') {
            console.log(`\n⚠️  WebSocket: ${err.message}`);
        } else {
            console.error('\n❌ Client Error:', err);
        }
    });

    try {
        // 1. Registration
        console.log('[1/4] Authenticating with Agent News...');
        await client.connect();
        console.log('✅ Registered! API Key acquired.');

        // 2. Check API Balance
        let apiBalance = await client.getCreditBalance();
        console.log(`      Current API Balance: ${apiBalance} SOL (Credits)`);

        // 3. Autonomous Funding (if needed)
        if (apiBalance < 0.001) {
            console.log('[2/4] Insufficient API credits. Checking on-chain SOL balance...');
            const connection = new Connection(RPC_URL, 'confirmed');
            const onChainBalance = await connection.getBalance(keypair.publicKey);
            const solBalance = onChainBalance / LAMPORTS_PER_SOL;
            console.log(`      On-chain SOL Balance: ${solBalance} SOL`);

            if (solBalance > 0.006) {
                const transferAmount = 0.001; // User requested 0.001
                console.log(`[3/4] Autonomously transferring ${transferAmount} SOL to Hot Wallet for credits...`);

                const transaction = new Transaction().add(
                    SystemProgram.transfer({
                        fromPubkey: keypair.publicKey,
                        toPubkey: new PublicKey(HOT_WALLET_ADDRESS),
                        lamports: transferAmount * LAMPORTS_PER_SOL,
                    })
                );

                const signature = await connection.sendTransaction(transaction, [keypair]);
                console.log(`✅ Transfer sent! Signature: ${signature}`);
                console.log('      Waiting for confirmation and webhook processing...');

                // Poll for balance update
                let attempts = 0;
                while (attempts < 12) {
                    process.stdout.write('.');
                    await new Promise(r => setTimeout(r, 10000));
                    apiBalance = await client.getCreditBalance();
                    if (apiBalance >= transferAmount) {
                        console.log(`\n🎉 Funding Complete! New API Balance: ${apiBalance} SOL`);
                        break;
                    }
                    attempts++;
                }
            } else {
                console.warn('⚠️  On-chain SOL balance too low to fund credits (need > 0.006 SOL for fee + transfer).');
            }
        }

        // 4. Test Connectivity
        console.log('[4/4] Testing REST API and WebSocket Fetch...');
        const signals = await client.getLatestSignals({ limit: 5 });
        console.log(`✅ Success! Received ${signals.length} signals via REST.`);

        console.log('      Waiting for WebSocket signals (30s)...');
        client.on('signal', (data) => {
            console.log(`🔥 [LIVE SIGNAL] ${data.headline}`);
        });

        await new Promise(r => setTimeout(r, 30000));
        console.log('--- Test Complete ---');
        client.disconnect();
        process.exit(0);

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
        process.exit(1);
    }
}

runTest();
