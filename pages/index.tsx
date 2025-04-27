// /pages/index.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
  const router = useRouter();

  // Redirect to thread-builder page
  useEffect(() => {
    router.push('/thread-builder');
  }, [router]);

  return (
    <>
      <Head>
        <title>Thread Builder</title>
        <meta name="description" content="Build and schedule your Twitter threads" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Redirecting to Thread Builder...</p>
      </div>
    </>
  );
}