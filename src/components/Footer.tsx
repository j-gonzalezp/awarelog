import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="text-center mt-12 py-6 border-t border-gray-200 dark:border-gray-700">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        © {new Date().getFullYear()} Mi App Base. Todos los derechos reservados.
      </p>
    </footer>
  );
};

export default Footer;