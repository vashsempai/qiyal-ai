import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ApolloProviderWrapper from '@/components/ApolloProviderWrapper';
import Chatbot from '@/components/Chatbot';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Qiyal AI',
  description: 'AI-powered application for intelligent solutions',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ApolloProviderWrapper>
          {children}
          <Chatbot />
        </ApolloProviderWrapper>
      </body>
    </html>
  );
}
