import { Metadata } from 'next';

interface BlogLayoutProps {
  children: React.ReactNode;
  params: { slug: string };
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  return {
    title: `博客文章 | PDF转图片工具`,
    description: 'PDF转图片工具博客文章详情页',
    openGraph: {
      title: '博客文章详情',
      description: 'PDF转图片工具博客文章详情页',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: '博客文章详情',
      description: 'PDF转图片工具博客文章详情页',
    },
  };
}

export default function BlogPostLayout({ children, params }: BlogLayoutProps) {
  return (
    <>
      {children}
    </>
  );
}