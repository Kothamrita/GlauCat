import './globals.css';             // ✅ Global CSS allowed
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { ScoreProvider } from './context/ScoreContext';
export const metadata = {
  title: 'GlauCat - Glaucoma & Cataract Platform',
  description: 'Monitor and manage glaucoma and cataract risks',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <ScoreProvider>
          <Navbar />
          <main style={{ flex: 1 }}>{children}</main>
          <Footer />
        </ScoreProvider>
      </body>
    </html>
  );
}
