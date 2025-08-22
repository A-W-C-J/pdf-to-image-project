# PDF to Image Converter

<div align="center">

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-www.pdf2img.top-blue?style=for-the-badge)](https://www.pdf2img.top)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/awcjs-projects/v0-pdf-to-image-project)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/VdIUBldKFpS)

**A high-performance, client-side PDF to image converter built with Next.js and PDF.js**

[🚀 Try Online Tool](https://www.pdf2img.top) • [📖 Documentation](#documentation) • [🤝 Contributing](#contributing)

</div>

## ✨ Features

- **🔄 Batch Conversion**: Convert multiple PDF pages to images simultaneously
- **🎨 Multiple Formats**: Support for PNG, JPEG, and WebP output formats
- **⚙️ Customizable Quality**: Adjustable scale and compression settings
- **🔒 Privacy First**: 100% client-side processing - your files never leave your device
- **💧 Watermark Support**: Add custom watermarks with configurable opacity and positioning
- **🔐 Password Protection**: Handle password-protected PDF files
- **📱 Mobile Responsive**: Works seamlessly on desktop and mobile devices
- **🌍 Multilingual**: Support for Chinese and English interfaces
- **🌙 Dark Mode**: Built-in theme switching
- **📝 SEO Blog**: Integrated blog system for technical articles

## 🚀 Quick Start

### Online Tool
Visit **[www.pdf2img.top](https://www.pdf2img.top)** to use the converter directly in your browser.

### Local Development

\`\`\`bash
# Clone the repository
git clone https://github.com/A-W-C-J/pdf-to-image-project.git

# Navigate to project directory
cd pdf-to-image-project

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local and add your Supabase credentials

# Start development server
npm run dev
\`\`\`

#### Environment Setup

1. **Supabase Configuration**: 
   - Visit [Supabase Dashboard](https://supabase.com/dashboard/project/_/settings/api)
   - Copy your project URL and anon key
   - Add them to `.env.local`:
     \`\`\`
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     \`\`\`

2. **Database Setup**:
   - Execute the SQL script in `scripts/001_create_blog_tables.sql` in your Supabase SQL Editor
   - This creates the necessary tables for the blog feature
   - See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions

3. **Optional - Blog Feature**:
   - Add DeepSeek API key for AI blog generation:
     \`\`\`
     DEEPSEEK_API_KEY=your_deepseek_api_key
     \`\`\` run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🛠️ Technology Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **PDF Processing**: PDF.js
- **Language**: TypeScript
- **Deployment**: Vercel

## 📖 Documentation

### Core Features

#### PDF Processing
The application uses PDF.js to render PDF pages as canvas elements, which are then converted to images. This approach ensures high-quality output while maintaining fast processing speeds.

#### Watermark System
Custom watermark functionality allows users to:
- Add text watermarks with custom content
- Position watermarks in different locations (center, corners)
- Adjust opacity levels
- Apply watermarks during the conversion process

#### Abuse Prevention
Built-in rate limiting and file validation:
- Maximum file size: 50MB
- Maximum pages per PDF: 50
- Hourly limits: 10 conversions, 100 pages
- Client-side usage tracking

### API Reference

The application is entirely client-side, but includes several key modules:

- `lib/i18n.tsx` - Internationalization system
- `lib/abuse-prevention.ts` - Rate limiting and validation
- `components/` - Reusable UI components

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Ensure mobile responsiveness
- Add proper error handling
- Include appropriate comments

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🔗 Links

- **Live Application**: [www.pdf2img.top](https://www.pdf2img.top)
- **Blog**: [www.pdf2img.top/blog](https://www.pdf2img.top/blog)
- **Issues**: [GitHub Issues](https://github.com/A-W-C-J/pdf-to-image-project/issues)

## 🙏 Acknowledgments

- [PDF.js](https://mozilla.github.io/pdf.js/) - Mozilla's PDF rendering library
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components

---

<div align="center">

**[⭐ Star this repository](https://github.com/A-W-C-J/pdf-to-image-project) if you find it helpful!**

Made with ❤️ by [A-W-C-J](https://github.com/A-W-C-J)

</div>
