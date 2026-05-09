import Navbar from './Navbar';
import Footer from './Footer';

interface MainLayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
  className?: string;
}

export default function MainLayout({ children, hideFooter = false, className }: MainLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className={`flex-1 pt-16 ${className || ''}`}>{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
}
