
import { Link } from "react-router-dom";
import { Github, Twitter, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-background border-t border-border py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-varna-purple to-varna-teal rounded-full w-8 h-8 flex items-center justify-center">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <span className="font-montserrat font-bold text-xl varna-gradient-text">Varnanetra</span>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-powered language learning for everyone. Master languages with personalized feedback and immersive experiences.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                <Github className="w-5 h-5" />
                <span className="sr-only">GitHub</span>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                <Twitter className="w-5 h-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                <Linkedin className="w-5 h-5" />
                <span className="sr-only">LinkedIn</span>
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-foreground mb-4">Features</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/grammar" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                  Grammar Correction
                </Link>
              </li>
              <li>
                <Link to="/pronunciation" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                  Pronunciation Coaching
                </Link>
              </li>
              <li>
                <Link to="/roleplay" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                  Roleplay Scenarios
                </Link>
              </li>
              <li>
                <Link to="/avatar" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                  Avatar Generation
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                  Learning Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-foreground mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                  API Reference
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                  Support
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-foreground mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Varnanetra. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
