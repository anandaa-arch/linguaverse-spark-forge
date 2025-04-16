
import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { motion } from "framer-motion";

interface LayoutProps {
  children: ReactNode;
  withFooter?: boolean;
}

const Layout = ({ children, withFooter = true }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <motion.main 
        className="flex-grow"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.main>
      {withFooter && <Footer />}
    </div>
  );
};

export default Layout;
