# PDF to Image Converter

<div align="center">

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-www.pdf2img.top-blue?style=for-the-badge)](https://www.pdf2img.top)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/awcjs-projects/v0-pdf-to-image-project)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js%2015-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)

**A comprehensive, AI-powered PDF processing platform with advanced OCR, batch conversion, and content generation capabilities**

[🚀 Try Online Tool](https://www.pdf2img.top) • [📖 Documentation](#documentation) • [🤝 Contributing](#contributing)

</div>

## ✨ Features

### 🔄 Core PDF Processing
- **Batch Conversion**: Convert multiple PDF files and pages simultaneously
- **Multiple Output Formats**: PNG, JPEG, WebP, and GIF animation support
- **High-Quality Rendering**: Customizable scale and compression settings
- **Password Protection**: Handle encrypted PDF files securely
- **Privacy First**: 100% client-side processing - files never leave your device

### 🤖 AI-Powered Features
- **OCR Text Extraction**: Advanced text recognition using Tesseract.js
- **Searchable PDF Generation**: Create searchable PDFs from scanned documents
- **AI Content Generation**: Integrated WebLLM for intelligent content processing
- **Smart Watermarking**: AI-assisted watermark positioning and optimization

### 🎨 Advanced Capabilities
- **GIF Animation Creation**: Convert PDF pages to animated GIFs
- **Batch File Processing**: Handle multiple files with progress tracking
- **Custom Watermarks**: Text and image watermarks with opacity control
- **PDF Manipulation**: Merge, split, and edit PDF documents using PDF-lib

### 🌐 User Experience
- **Multilingual Support**: Chinese and English interfaces with next-intl
- **Dark/Light Themes**: Seamless theme switching with next-themes
- **Mobile Responsive**: Optimized for all device sizes
- **Real-time Progress**: Live conversion progress with detailed feedback
- **Error Handling**: Comprehensive error boundary system

### 📝 Content Management
- **Integrated Blog System**: Technical articles and tutorials
- **SEO Optimization**: Built-in SEO components and schema markup
- **Firebase Analytics**: User behavior tracking and insights
- **Supabase Backend**: Robust data management and storage

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

### Frontend Framework
- **Next.js 15**: React framework with App Router and Server Components
- **React 19**: Latest React with concurrent features
- **TypeScript**: Full type safety and enhanced developer experience

### Styling & UI
- **Tailwind CSS v4**: Utility-first CSS framework with PostCSS
- **Stylus**: CSS preprocessor for component-specific styling
- **shadcn/ui**: Beautiful and accessible UI components
- **Radix UI**: Headless UI primitives for complex components
- **next-themes**: Theme switching with system preference support

### PDF & Document Processing
- **PDF.js (pdfjs-dist)**: Mozilla's PDF rendering engine
- **PDF-lib**: PDF creation and manipulation
- **Tesseract.js**: OCR text extraction and recognition
- **GIF.js**: Animated GIF generation from PDF pages

### AI & Machine Learning
- **@mlc-ai/web-llm**: Client-side large language model integration
- **WebLLM**: Browser-based AI content generation

### Backend & Database
- **Supabase**: Backend-as-a-Service with PostgreSQL
- **Firebase**: Analytics and performance monitoring
- **next-intl**: Internationalization with server-side rendering

### Development & Testing
- **Jest**: Unit testing framework with React Testing Library
- **ESLint**: Code linting with Next.js configuration
- **Webpack**: Custom loaders for Stylus and CSS modules

### Deployment & Analytics
- **Vercel**: Serverless deployment platform
- **Firebase Analytics**: User behavior tracking
- **SEO Optimization**: Built-in meta tags and schema markup

## 📖 Documentation

### Architecture Overview

The application follows a modern Next.js 15 architecture with:
- **Server Components**: For SEO-optimized static content
- **Client Components**: For interactive PDF processing
- **Hybrid Styling**: Tailwind CSS + Stylus modules
- **Error Boundaries**: Comprehensive error handling system

### Core Features

#### PDF Processing Engine
- **PDF.js Integration**: Renders PDF pages as high-quality canvas elements
- **Multi-format Export**: PNG, JPEG, WebP with customizable quality
- **Batch Processing**: Concurrent file processing with progress tracking
- **Memory Management**: Efficient handling of large files and multiple pages

#### OCR & Text Extraction
- **Tesseract.js**: Advanced optical character recognition
- **Searchable PDFs**: Generate PDFs with embedded text layers
- **Multi-language Support**: OCR for various languages
- **Word-level Coordinates**: Precise text positioning data

#### AI-Powered Features
- **WebLLM Integration**: Client-side language model processing
- **Content Generation**: AI-assisted text and content creation
- **Smart Processing**: Intelligent document analysis and optimization

#### Advanced Capabilities
- **GIF Animation**: Convert PDF sequences to animated GIFs
- **PDF Manipulation**: Merge, split, and edit documents with PDF-lib
- **Custom Watermarking**: Text and image overlays with positioning control
- **Batch Operations**: Process multiple files simultaneously

#### Security & Privacy
- **Client-side Processing**: All operations performed locally
- **File Validation**: Comprehensive input validation and sanitization
- **Error Handling**: Robust error boundaries and user feedback
- **Rate Limiting**: Built-in abuse prevention mechanisms

### Key Modules

- `app/page.tsx` - Main PDF converter interface with all features
- `components/error-boundary.tsx` - Application-wide error handling
- `lib/i18n.tsx` - Internationalization with next-intl
- `lib/validation.ts` - File and input validation system
- `lib/error-handler.ts` - Centralized error management
- `components/ui/` - Reusable UI components with Stylus styling
- `app/blog/` - Integrated blog system with Supabase backend

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- **TypeScript**: Maintain strict type safety and use proper interfaces
- **Styling**: Use Tailwind CSS for utilities and Stylus modules for component-specific styles
- **Components**: Follow React best practices with proper error boundaries
- **Testing**: Write unit tests with Jest and React Testing Library
- **Performance**: Optimize for Web Vitals and minimize client-side JavaScript
- **Accessibility**: Ensure WCAG compliance and keyboard navigation
- **Internationalization**: Use next-intl for all user-facing text
- **Error Handling**: Implement comprehensive error boundaries and validation

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🔗 Links

- **Live Application**: [www.pdf2img.top](https://www.pdf2img.top)
- **Blog**: [www.pdf2img.top/blog](https://www.pdf2img.top/blog)
- **Issues**: [GitHub Issues](https://github.com/A-W-C-J/pdf-to-image-project/issues)

## 🙏 Acknowledgments

- [PDF.js](https://mozilla.github.io/pdf.js/) - Mozilla's PDF rendering library
- [Next.js](https://nextjs.org/) - React framework with App Router
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful and accessible UI components
- [Radix UI](https://www.radix-ui.com/) - Headless UI primitives
- [Tesseract.js](https://tesseract.projectnaptha.com/) - OCR engine for JavaScript
- [PDF-lib](https://pdf-lib.js.org/) - PDF creation and manipulation
- [WebLLM](https://webllm.mlc.ai/) - Client-side large language models
- [Supabase](https://supabase.com/) - Backend-as-a-Service platform
- [Stylus](https://stylus-lang.com/) - Expressive CSS preprocessor
- [next-intl](https://next-intl-docs.vercel.app/) - Internationalization for Next.js
- [next-themes](https://github.com/pacocoursey/next-themes) - Theme switching library

---

<div align="center">

**[⭐ Star this repository](https://github.com/A-W-C-J/pdf-to-image-project) if you find it helpful!**

Made with ❤️ by [A-W-C-J](https://github.com/A-W-C-J)

</div>
