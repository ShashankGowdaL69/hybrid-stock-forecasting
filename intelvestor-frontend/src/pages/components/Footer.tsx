import { FacebookIcon, TwitterIcon, InstagramIcon, LinkedinIcon } from 'lucide-react';
import React from 'react';

const Footer: React.FC = () => {
  const socialLinks = [
    { icon: <FacebookIcon className="w-6 h-6" />, url: '#', label: 'Facebook' },
    { icon: <TwitterIcon className="w-6 h-6" />, url: '#', label: 'Twitter' },
    { icon: <InstagramIcon className="w-6 h-6" />, url: '#', label: 'Instagram' },
    { icon: <LinkedinIcon className="w-6 h-6" />, url: '#', label: 'LinkedIn' },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <span className="text-white font-bold text-xl">
                IntelVestor <span className="text-blue-400">AI</span>
              </span>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              Forecast Indian stocks with AI-driven sentiment fusion, predictions, and risk management for informed investments.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((link, index) => (
                <a key={index} href={link.url} className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                  {link.icon}
                </a>
              ))}
            </div>
          </div>
          {/* <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#features" className="text-gray-300 hover:text-blue-400 transition-colors duration-200">Features</a></li>
              <li><a href="#testimonials" className="text-gray-300 hover:text-blue-400 transition-colors duration-200">Testimonials</a></li>
              <li><a href="/dashboard/upgrade" className="text-gray-300 hover:text-blue-400 transition-colors duration-200">Pricing</a></li>
              <li><a href="/dashboard" className="text-gray-300 hover:text-blue-400 transition-colors duration-200">Dashboard</a></li>
            </ul>
          </div> */}
          {/* <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Support</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-blue-400 transition-colors duration-200">Help Center</a></li>
              <li><a href="#" className="text-gray-300 hover:text-blue-400 transition-colors duration-200">Contact Us</a></li>
              <li><a href="#" className="text-gray-300 hover:text-blue-400 transition-colors duration-200">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-300 hover:text-blue-400 transition-colors duration-200">Terms of Service</a></li>
            </ul>
          </div> */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;