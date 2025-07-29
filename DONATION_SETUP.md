# Donation Setup Guide

## USDC Address Configuration

The donation functionality requires a USDC receive address on the Base blockchain. This address should be configured securely using environment variables.

### Environment Variable Setup

1. **Create or update your `.env.local` file** in the project root:

```bash
# Existing variables...
NEXT_PUBLIC_APP_URL=https://addplaybutton.xyz
NEXT_PUBLIC_APP_DOMAIN=addplaybutton.xyz
JWT_SECRET_KEY=your-jwt-secret
WARPCAST_API_KEY=your-warpcast-api-key
NEYNAR_API_KEY=your-neynar-api-key

# Add the USDC donation address
NEXT_PUBLIC_USDC_ADDRESS=0xYourBaseUSDCAddressHere

# Add the Coinbase App ID for payment integration
NEXT_PUBLIC_COINBASE_APP_ID=your-coinbase-project-id-here
```

2. **For production deployment** (Vercel, etc.), add the environment variable in your deployment platform:
   - Variable name: `NEXT_PUBLIC_USDC_ADDRESS`
   - Value: Your Base USDC receive address

### Security Considerations

- ✅ **Public variable**: Using `NEXT_PUBLIC_` prefix is safe for donation addresses since they're meant to be public
- ✅ **Base network**: Ensure the address is on Base network (not Ethereum mainnet)
- ✅ **USDC contract**: Verify the address can receive USDC tokens
- ⚠️ **Backup**: Keep a secure backup of your private keys elsewhere

### Address Format

The USDC address should be a valid Ethereum address on Base network:
- Format: `0x` followed by 40 hexadecimal characters
- Example: `0x1234567890123456789012345678901234567890`

### Coinbase App ID Setup

To enable Coinbase Wallet payments, you need a Project ID from the Coinbase Developer Platform:

1. **Go to [Coinbase Developer Platform](https://cdp.coinbase.com/)**
2. **Create a new project** or select an existing one
3. **Find your Project ID** in the project dashboard
4. **Add it to your environment variables** as `NEXT_PUBLIC_COINBASE_APP_ID`

**Note**: This is different from any mini-app integration with Coinbase Wallet. This ID is specifically for using Coinbase's Onramp payment services.

### Testing

1. **Local development**: Set the address in `.env.local`
2. **Production**: Verify the address displays correctly in the donation card
3. **Fallback**: If no address is set, a placeholder address will be shown

### Features

- **Display**: The address is shown in a copyable format in the donation card
- **Copy button**: Users can easily copy the address to their clipboard
- **Cast integration**: When users click "Donate $1 USDC", it creates a cast with the address
- **Network specification**: Clearly indicates this is for Base network USDC

### Example Usage

When a user clicks the donation button, it creates a cast like:
```
🎵 Supporting Add Play Button with $1 USDC 💜

If you find this tool helpful, consider supporting the creator!

USDC (Base): 0xYourBaseUSDCAddressHere
```

This allows users to easily copy the address and send USDC donations directly to the creator.