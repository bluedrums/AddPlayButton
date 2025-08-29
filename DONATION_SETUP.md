# Donation Setup Guide

## Environment Variables Required

The donation functionality requires several environment variables for both Farcaster and Base payment methods.

### Environment Variable Setup

1. **Create or update your `.env.local` file** in the project root:

```bash
# Existing variables...
NEXT_PUBLIC_APP_URL=https://addplaybutton.xyz
NEXT_PUBLIC_APP_DOMAIN=addplaybutton.xyz
JWT_SECRET_KEY=your-jwt-secret
WARPCAST_API_KEY=your-warpcast-api-key
NEYNAR_API_KEY=your-neynar-api-key

# Donation Configuration
NEXT_PUBLIC_USDC_ADDRESS=0xYourBaseUSDCAddressHere
NEXT_PUBLIC_BASE_PROJECT_ID=your-base-project-id-here

# (Optional) Coinbase App ID – Only needed if you later switch to Coinbase Pay Onramp flow
# NEXT_PUBLIC_COINBASE_APP_ID=your-coinbase-project-id-here
```

## Base Project ID Setup

The Base Pay functionality requires a Project ID from Base:

1. **Go to [Base Pay Dashboard](https://www.base.org/pay)**
2. **Create a new project** or select an existing one
3. **Copy your Project ID** from the project settings
4. **Add it to your environment variables** as `NEXT_PUBLIC_BASE_PROJECT_ID`

### Example Project ID Format
```
NEXT_PUBLIC_BASE_PROJECT_ID=prj_1234567890abcdef
```

2. **For production deployment** (Vercel, etc.), add the environment variables in your deployment platform:
   - Variable name: `NEXT_PUBLIC_USDC_ADDRESS`
     - Value: Your Base USDC receive address
   - Variable name: `NEXT_PUBLIC_BASE_PROJECT_ID`
     - Value: Your Base Pay Project ID

### Security Considerations

- ✅ **Public variables**: Using `NEXT_PUBLIC_` prefix is safe for donation addresses and Base Project IDs since they're meant to be public
- ✅ **Base network**: Ensure the address is on Base network (not Ethereum mainnet)
- ✅ **USDC contract**: Verify the address can receive USDC tokens
- ✅ **Base Project ID**: Ensure you have access to the Base Pay project and it's properly configured
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

1. **Local development**: Set both environment variables in `.env.local`
2. **Production**: Verify both variables are set in your deployment platform
3. **Debug check**: Visit `https://yourdomain.com?debug=env` to see variable status
4. **API check**: Use `/api/env-check` endpoint to verify variables
5. **Fallback**: If variables aren't set, buttons will show appropriate error messages

### Features

- **Dual Payment Methods**: Users can choose between Farcaster Wallet and Base Pay
- **Farcaster Integration**: Seamless integration with Farcaster wallet for authenticated users
- **Base Pay**: Gasless USDC payments using Base's native payment infrastructure
- **Error Handling**: Clear error messages if environment variables aren't configured
- **Network specification**: Both methods work on Base network for USDC

### Example Usage

When a user clicks the donation button, it creates a cast like:
```
🎵 Supporting Add Play Button with $1 USDC 💜

If you find this tool helpful, consider supporting the creator!

USDC (Base): 0xYourBaseUSDCAddressHere
```

This allows users to easily copy the address and send USDC donations directly to the creator.