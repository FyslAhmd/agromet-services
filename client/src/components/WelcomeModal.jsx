import { useEffect } from "react";

const WelcomeModal = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      // Auto close after 3 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      // Cleanup timer on unmount
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

      {/* Modal Content */}
      <div className="relative z-10 max-w-2xl w-full mx-4 animate-fade-in">
        <img
          src="/starting_modal.jpeg"
          alt="Welcome"
          className="w-full h-auto rounded-lg shadow-2xl"
          onError={(e) => {
            console.error("Failed to load welcome image");
            e.target.style.display = "none";
          }}
        />
      </div>
    </div>
  );
};

export default WelcomeModal;
