// app/layout.tsx
'use client'; // Client component banana zaroori ho sakta hai agar ChakraProvider use ho raha hai

import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
// 1. Apne naye AI Co-Pilot component ko import karein
import { AICoPilotPanel } from '../components/AICoPilotPanel';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ChakraProvider value={defaultSystem}>
          {/* '{children}' aapke main page (jaise HomePage) ko render karta hai */}
          {children}

          {/* 2. Yahan par AI Co-Pilot ko render karein */}
          {/* Yeh sunishchit karega ki chat box har page par dikhe */}
          <AICoPilotPanel onDataModified={() => { }} />
        </ChakraProvider>
      </body>
    </html>
  );
}
