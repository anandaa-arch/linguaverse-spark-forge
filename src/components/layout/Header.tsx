
import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, BookOpen, Mic, MessageSquare, User, BarChart3, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navItems = [
    { name: "Home", path: "/", icon: <Home className="w-5 h-5" /> },
    { name: "Grammar", path: "/grammar", icon: <BookOpen className="w-5 h-5" /> },
    { name: "Pronunciation", path: "/pronunciation", icon: <Mic className="w-5 h-5" /> },
    { name: "Roleplay", path: "/roleplay", icon: <MessageSquare className="w-5 h-5" /> },
    { name: "Avatar", path: "/avatar", icon: <User className="w-5 h-5" /> },
    { name: "Dashboard", path: "/dashboard", icon: <BarChart3 className="w-5 h-5" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-background/80 border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="bg-gradient-to-r from-varna-purple to-varna-teal rounded-full w-8 h-8 flex items-center justify-center">
            <span className="text-white font-bold text-lg">V</span>
          </div>
          <span className="font-montserrat font-bold text-xl varna-gradient-text">Varnanetra</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="group flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              {item.name}
              <span className="h-0.5 w-0 bg-primary group-hover:w-full transition-all duration-300 mt-0.5"></span>
            </Link>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden p-2 rounded-md focus:outline-none"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden bg-background border-b border-border"
          >
            <nav className="container mx-auto px-4 py-4 flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent transition-colors duration-200"
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
