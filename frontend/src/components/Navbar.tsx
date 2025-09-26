import React from 'react';
import Link from 'next/link';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between">
          <div className="flex space-x-7">
            <div>
              <Link href="/" className="flex items-center py-4 px-2">
                <span className="font-semibold text-gray-500 text-lg">QiyalAI</span>
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-1">
              <Link
                href="/"
                className="py-4 px-2 text-gray-500 font-semibold hover:text-green-500 transition duration-300"
              >
                Home
              </Link>
              <Link
                href="/about"
                className="py-4 px-2 text-gray-500 font-semibold hover:text-green-500 transition duration-300"
              >
                About
              </Link>
              <Link
                href="/services"
                className="py-4 px-2 text-gray-500 font-semibold hover:text-green-500 transition duration-300"
              >
                Services
              </Link>
              <Link
                href="/contact"
                className="py-4 px-2 text-gray-500 font-semibold hover:text-green-500 transition duration-300"
              >
                Contact
              </Link>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-3">
            <Link
              href="/login"
              className="py-2 px-2 font-medium text-gray-500 rounded hover:bg-green-500 hover:text-white transition duration-300"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="py-2 px-2 font-medium text-white bg-green-500 rounded hover:bg-green-400 transition duration-300"
            >
              Sign Up
            </Link>
          </div>
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button className="outline-none mobile-menu-button">
              <svg
                className="w-6 h-6 text-gray-500 hover:text-green-500"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="m3 12h18M3 6h18M3 18h18"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      <div className="hidden mobile-menu">
        <ul>
          <li className="active">
            <Link href="/" className="block text-sm px-2 py-4 hover:bg-green-500 transition duration-300">
              Home
            </Link>
          </li>
          <li>
            <Link href="/about" className="block text-sm px-2 py-4 hover:bg-green-500 transition duration-300">
              About
            </Link>
          </li>
          <li>
            <Link href="/services" className="block text-sm px-2 py-4 hover:bg-green-500 transition duration-300">
              Services
            </Link>
          </li>
          <li>
            <Link href="/contact" className="block text-sm px-2 py-4 hover:bg-green-500 transition duration-300">
              Contact
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
