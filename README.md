# Add Play Button - Farcaster MiniApp

A Farcaster MiniApp that transforms music and video links into interactive play buttons. Create shareable cards for Spotify, Apple Music, YouTube, Vimeo, and SoundCloud that play directly in the Farcaster miniapp window.

## 🎵 Features

- **Multi-Platform Support**: Works with Spotify, Apple Music, YouTube, Vimeo, and SoundCloud
- **Embedded Playback**: Music and videos play directly within Farcaster without leaving the app
- **Shareable Cards**: Create beautiful, interactive cards that your followers can engage with
- **Farcaster Integration**: Seamless casting and sharing within the Farcaster ecosystem
- **Mobile Optimized**: Responsive design that works perfectly on mobile devices

## 🚀 Live Demo

**[https://addplaybutton.xyz](https://addplaybutton.xyz)**

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Authentication**: Farcaster Auth Kit
- **UI**: Radix UI + Tailwind CSS
- **Database**: Neon Postgres
- **Deployment**: Vercel

## 📱 How It Works

1. **Paste a Link**: Enter any Spotify, Apple Music, YouTube, Vimeo, or SoundCloud URL
2. **Customize**: Add a title, description, and cover image
3. **Create Card**: Generate an interactive play button card
4. **Share**: Cast your card to Farcaster for your followers to enjoy

### Farcaster MiniApp Requirements

- ✅ Serves `/.well-known/farcaster.json` manifest
- ✅ Includes proper metadata tags (`fc:miniapp`, `fc:frame`)
- ✅ Mobile-responsive design
- ✅ Farcaster authentication integration
- ✅ Casting functionality

## 📞 Support

- **Website**: [https://addplaybutton.xyz](https://addplaybutton.xyz)
- **Farcaster**: [@addplaybutton](https://warpcast.com/addplaybutton)
- **Issues**: [GitHub Issues](https://github.com/bluedrums/AddPlayButton/issues)
- **Development**: [Rain On Me Productions](https://rainonmeproductions.com)

## Environment variables

Put these in `.env.local`. That file is gitignored. Do not commit values.

Required:

- `JWT_SECRET_KEY` — signs session cookies
- `POSTGRES_URL` — Neon/Vercel Postgres connection string
- `NEXT_PUBLIC_APP_URL` — public origin of this deployment, for example `https://addplaybutton.xyz`

Optional:

- `NEXT_PUBLIC_APP_DOMAIN` — hostname used by the client when it differs from the browser host
- `NEXT_PUBLIC_USDC_ADDRESS` — Base address that receives USDC tips
- `NEXT_PUBLIC_BASE_PROJECT_ID` — Coinbase Developer Platform project id for OnchainKit
- `NEXT_PUBLIC_ONCHAINKIT_API_KEY` — OnchainKit client key
- `WARPCAST_API_KEY` — server key for Farcaster auth and cast lookup
- `NEYNAR_API_KEY` — server key for mini app notifications

The manifest at `public/.well-known/farcaster.json` is signed for `addplaybutton.xyz`. A fork needs its own domain, account association, and Neynar webhook URL.

## License

Source code is licensed under the MIT License. See [LICENSE](LICENSE).

The Add Play Button name and logo are not covered by this license. Operators of a fork still have to follow the terms of Spotify, Apple Music, YouTube, Vimeo, SoundCloud, Mixcloud, and any other embed provider they use. This license does not grant those rights.

## 🙏 Acknowledgments

- Built with [Farcaster](https://farcaster.xyz) and [Neynar](https://neynar.com)
- UI components from [Radix UI](https://radix-ui.com)
- Icons from [Lucide React](https://lucide.dev and https://t.me/voidrainbow)

---

Made with ❤️ for the Farcaster community
