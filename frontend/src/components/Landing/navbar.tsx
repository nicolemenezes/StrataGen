import UINavbar from "@/components/ui/Navbar";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  const handleNavigate = (sectionId: string) => {
    // Map navbar items to their corresponding section IDs
    const sectionMap: { [key: string]: string } = {
      home: "hero",
      benefits: "benefits",
      about: "how-it-works",
      pricing: "pricing",
    };

    const targetId = sectionMap[sectionId] || sectionId;
    const element = document.getElementById(targetId);

    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSignIn = () => {
    // Navigate to LoginPage
    navigate("/login?mode=login");
  };

  const handleSignUp = () => {
    // Navigate to LoginPage (you can create separate signup page if needed)
    navigate("/login?mode=register");
  };

  return (
    <UINavbar
      onNavigate={handleNavigate}
      onSignIn={handleSignIn}
      onSignUp={handleSignUp}
    />
  );
};

export default Navbar;