import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerificationRequest {
  paymentId: string;
  transactionHash: string;
  network: string;
  expectedAmount: number;
  expectedAddress: string;
}

interface VerificationResult {
  verified: boolean;
  status: 'confirmed' | 'pending' | 'failed' | 'not_found';
  confirmations?: number;
  actualAmount?: string;
  message: string;
}

// Etherscan API verification (for ETH and ERC-20 tokens)
async function verifyEthereumTransaction(
  txHash: string,
  expectedAddress: string,
  expectedAmount: number,
  apiKey: string
): Promise<VerificationResult> {
  try {
    console.log(`Verifying ETH transaction: ${txHash}`);
    
    const response = await fetch(
      `https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${apiKey}`
    );
    
    const data = await response.json();
    
    if (data.error || !data.result) {
      console.log('Transaction not found on Etherscan');
      return {
        verified: false,
        status: 'not_found',
        message: 'Transaction not found on the Ethereum network'
      };
    }
    
    const tx = data.result;
    
    // Check if transaction is to the expected address
    if (tx.to?.toLowerCase() !== expectedAddress.toLowerCase()) {
      console.log(`Address mismatch: expected ${expectedAddress}, got ${tx.to}`);
      return {
        verified: false,
        status: 'failed',
        message: 'Transaction recipient address does not match'
      };
    }
    
    // Get transaction receipt for confirmation status
    const receiptResponse = await fetch(
      `https://api.etherscan.io/api?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}&apikey=${apiKey}`
    );
    
    const receiptData = await receiptResponse.json();
    
    if (!receiptData.result) {
      return {
        verified: false,
        status: 'pending',
        message: 'Transaction is pending confirmation'
      };
    }
    
    const receipt = receiptData.result;
    
    if (receipt.status === '0x0') {
      return {
        verified: false,
        status: 'failed',
        message: 'Transaction failed on the blockchain'
      };
    }
    
    // Get current block for confirmation count
    const blockResponse = await fetch(
      `https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=${apiKey}`
    );
    const blockData = await blockResponse.json();
    const currentBlock = parseInt(blockData.result, 16);
    const txBlock = parseInt(receipt.blockNumber, 16);
    const confirmations = currentBlock - txBlock;
    
    // Convert value from wei to ether
    const valueInWei = BigInt(tx.value);
    const valueInEth = Number(valueInWei) / 1e18;
    
    console.log(`Transaction confirmed with ${confirmations} confirmations, value: ${valueInEth} ETH`);
    
    return {
      verified: confirmations >= 3,
      status: confirmations >= 3 ? 'confirmed' : 'pending',
      confirmations,
      actualAmount: valueInEth.toFixed(6),
      message: confirmations >= 3 
        ? `Transaction confirmed with ${confirmations} confirmations`
        : `Transaction pending - ${confirmations}/3 confirmations`
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error verifying Ethereum transaction:', errorMessage);
    return {
      verified: false,
      status: 'failed',
      message: `Verification error: ${errorMessage}`
    };
  }
}

// Tronscan API verification (for TRC-20 tokens like USDT)
async function verifyTronTransaction(
  txHash: string,
  expectedAddress: string,
  expectedAmount: number,
  apiKey: string
): Promise<VerificationResult> {
  try {
    console.log(`Verifying TRON transaction: ${txHash}`);
    
    const response = await fetch(
      `https://apilist.tronscanapi.com/api/transaction-info?hash=${txHash}`,
      {
        headers: {
          'TRON-PRO-API-KEY': apiKey
        }
      }
    );
    
    const data = await response.json();
    
    if (!data || data.contractRet === 'REVERT') {
      console.log('Transaction not found or reverted on Tronscan');
      return {
        verified: false,
        status: 'not_found',
        message: 'Transaction not found or reverted on the TRON network'
      };
    }
    
    // Check confirmation status
    if (!data.confirmed) {
      return {
        verified: false,
        status: 'pending',
        message: 'Transaction is pending confirmation on TRON network'
      };
    }
    
    // For TRC-20 transfers, check the token transfer info
    let toAddress = data.toAddress;
    let amount = 0;
    
    if (data.trc20TransferInfo && data.trc20TransferInfo.length > 0) {
      const transfer = data.trc20TransferInfo[0];
      toAddress = transfer.to_address;
      // USDT has 6 decimals on TRON
      amount = parseFloat(transfer.amount_str) / 1e6;
    } else if (data.contractData) {
      toAddress = data.contractData.to_address || data.toAddress;
      amount = (data.contractData.amount || 0) / 1e6;
    }
    
    // Normalize addresses for comparison (TRON addresses can have different formats)
    const normalizedExpected = expectedAddress.toLowerCase();
    const normalizedTo = toAddress?.toLowerCase();
    
    if (normalizedTo && !normalizedTo.includes(normalizedExpected.slice(-10))) {
      console.log(`Address mismatch: expected ${expectedAddress}, got ${toAddress}`);
      return {
        verified: false,
        status: 'failed',
        message: 'Transaction recipient address does not match'
      };
    }
    
    console.log(`TRON transaction confirmed, amount: ${amount}`);
    
    return {
      verified: true,
      status: 'confirmed',
      confirmations: data.confirmations || 19,
      actualAmount: amount.toString(),
      message: `Transaction confirmed on TRON network`
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error verifying TRON transaction:', errorMessage);
    return {
      verified: false,
      status: 'failed',
      message: `Verification error: ${errorMessage}`
    };
  }
}

// Bitcoin verification using Blockstream API (no API key needed)
async function verifyBitcoinTransaction(
  txHash: string,
  expectedAddress: string,
  expectedAmount: number
): Promise<VerificationResult> {
  try {
    console.log(`Verifying Bitcoin transaction: ${txHash}`);
    
    const response = await fetch(`https://blockstream.info/api/tx/${txHash}`);
    
    if (!response.ok) {
      console.log('Transaction not found on Blockstream');
      return {
        verified: false,
        status: 'not_found',
        message: 'Transaction not found on the Bitcoin network'
      };
    }
    
    const tx = await response.json();
    
    // Check if transaction is confirmed
    if (!tx.status?.confirmed) {
      return {
        verified: false,
        status: 'pending',
        message: 'Transaction is pending confirmation'
      };
    }
    
    // Find output to expected address
    const output = tx.vout?.find((out: { scriptpubkey_address?: string }) => 
      out.scriptpubkey_address?.toLowerCase() === expectedAddress.toLowerCase()
    );
    
    if (!output) {
      console.log(`Address not found in transaction outputs`);
      return {
        verified: false,
        status: 'failed',
        message: 'Expected address not found in transaction outputs'
      };
    }
    
    // Get current block height for confirmations
    const blockHeightResponse = await fetch('https://blockstream.info/api/blocks/tip/height');
    const currentHeight = await blockHeightResponse.json();
    const confirmations = currentHeight - tx.status.block_height + 1;
    
    // Convert satoshis to BTC
    const amountBtc = output.value / 1e8;
    
    console.log(`Bitcoin transaction confirmed with ${confirmations} confirmations, amount: ${amountBtc} BTC`);
    
    return {
      verified: confirmations >= 3,
      status: confirmations >= 3 ? 'confirmed' : 'pending',
      confirmations,
      actualAmount: amountBtc.toFixed(8),
      message: confirmations >= 3
        ? `Transaction confirmed with ${confirmations} confirmations`
        : `Transaction pending - ${confirmations}/3 confirmations`
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error verifying Bitcoin transaction:', errorMessage);
    return {
      verified: false,
      status: 'failed',
      message: `Verification error: ${errorMessage}`
    };
  }
}

// Solana verification using Solscan API v2
async function verifySolanaTransaction(
  txHash: string,
  expectedAddress: string,
  expectedAmount: number,
  apiKey: string
): Promise<VerificationResult> {
  try {
    console.log(`Verifying Solana transaction via Solscan: ${txHash}`);
    
    // Use Solscan API v2
    const response = await fetch(
      `https://pro-api.solscan.io/v2.0/transaction/detail?tx=${txHash}`,
      {
        headers: {
          'token': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      console.log(`Solscan API error: ${response.status}`);
      return {
        verified: false,
        status: 'not_found',
        message: 'Transaction not found on Solana network'
      };
    }
    
    const data = await response.json();
    
    if (!data.success || !data.data) {
      console.log('Transaction not found on Solscan');
      return {
        verified: false,
        status: 'not_found',
        message: 'Transaction not found on the Solana network'
      };
    }
    
    const tx = data.data;
    
    // Check transaction status
    if (tx.status !== 'Success') {
      return {
        verified: false,
        status: 'failed',
        message: `Transaction failed: ${tx.status}`
      };
    }
    
    // Get SOL transfer amount from the transaction
    let transferAmount = 0;
    
    // Check for SOL transfers in the transaction
    if (tx.sol_transfer && Array.isArray(tx.sol_transfer)) {
      for (const transfer of tx.sol_transfer) {
        if (transfer.destination?.toLowerCase() === expectedAddress.toLowerCase() ||
            transfer.destination_owner?.toLowerCase() === expectedAddress.toLowerCase()) {
          transferAmount += (transfer.amount || 0) / 1e9; // Convert lamports to SOL
        }
      }
    }
    
    // Also check parsed instructions for transfers
    if (tx.parsed_instructions && Array.isArray(tx.parsed_instructions)) {
      for (const instruction of tx.parsed_instructions) {
        if (instruction.type === 'transfer' && instruction.params) {
          const dest = instruction.params.destination;
          if (dest?.toLowerCase() === expectedAddress.toLowerCase()) {
            const amount = instruction.params.amount || instruction.params.lamports || 0;
            transferAmount += amount / 1e9;
          }
        }
      }
    }
    
    // Get confirmation status
    const confirmations = tx.confirmations || 0;
    const isFinalized = tx.confirmation_status === 'finalized' || confirmations >= 32;
    
    console.log(`Solana transaction verified: ${isFinalized ? 'finalized' : 'pending'}, amount: ${transferAmount} SOL`);
    
    return {
      verified: isFinalized,
      status: isFinalized ? 'confirmed' : 'pending',
      confirmations,
      actualAmount: transferAmount.toFixed(6),
      message: isFinalized
        ? `Transaction finalized on Solana`
        : `Transaction pending confirmation`
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error verifying Solana transaction:', errorMessage);
    return {
      verified: false,
      status: 'failed',
      message: `Verification error: ${errorMessage}`
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { paymentId, transactionHash, network, expectedAmount, expectedAddress } = await req.json() as VerificationRequest;

    console.log(`Verifying payment ${paymentId} on ${network}`);
    console.log(`Transaction: ${transactionHash}`);
    console.log(`Expected: ${expectedAmount} to ${expectedAddress}`);

    let result: VerificationResult;

    switch (network.toLowerCase()) {
      case 'ethereum':
      case 'erc20':
      case 'eth':
        const etherscanApiKey = Deno.env.get('ETHERSCAN_API_KEY') ?? '';
        result = await verifyEthereumTransaction(transactionHash, expectedAddress, expectedAmount, etherscanApiKey);
        break;
      
      case 'tron':
      case 'trc20':
      case 'trx':
        const tronscanApiKey = Deno.env.get('TRONSCAN_API_KEY') ?? '';
        result = await verifyTronTransaction(transactionHash, expectedAddress, expectedAmount, tronscanApiKey);
        break;
      
      case 'bitcoin':
      case 'btc':
        result = await verifyBitcoinTransaction(transactionHash, expectedAddress, expectedAmount);
        break;
      
      case 'solana':
      case 'sol':
        const solscanApiKey = Deno.env.get('SOLSCAN_API_KEY') ?? '';
        result = await verifySolanaTransaction(transactionHash, expectedAddress, expectedAmount, solscanApiKey);
        break;
      
      default:
        console.log(`Unsupported network: ${network}`);
        result = {
          verified: false,
          status: 'failed',
          message: `Unsupported network: ${network}. Manual verification required.`
        };
    }

    // If verified, update the payment status automatically
    if (result.verified && paymentId) {
      console.log(`Auto-approving payment ${paymentId}`);
      
      const { error: updateError } = await supabaseClient
        .from('payments')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          verification_data: {
            auto_verified: true,
            verified_at: new Date().toISOString(),
            confirmations: result.confirmations,
            actual_amount: result.actualAmount
          }
        })
        .eq('id', paymentId);

      if (updateError) {
        console.error('Error updating payment:', updateError);
      } else {
        // Also activate the membership
        const { data: payment } = await supabaseClient
          .from('payments')
          .select('user_id, membership_id')
          .eq('id', paymentId)
          .single();

        if (payment?.membership_id) {
          await supabaseClient
            .from('memberships')
            .update({
              status: 'active',
              starts_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            })
            .eq('id', payment.membership_id);
        }

        // Send activation email
        if (payment?.user_id) {
          try {
            await supabaseClient.functions.invoke('send-membership-activation', {
              body: { userId: payment.user_id }
            });
          } catch (e) {
            console.error('Error sending activation email:', e);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...result
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in verify-crypto-payment:', errorMessage);
    return new Response(
      JSON.stringify({ 
        success: false, 
        verified: false,
        status: 'failed',
        message: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
