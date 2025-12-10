import { useNavigate } from "react-router-dom";

// Generate random 8-character unique code
const generateUniqueCode = (): string => {
  return Math.random().toString(36).substring(2, 10);
};

// Custom hook to navigate to a random editor session
export const useNavigateToRandomEditor = () => {
  const navigate = useNavigate();

  const navigateToRandomEditor = () => {
    const uniqueCode = generateUniqueCode();
    navigate(`/${uniqueCode}`);
  };

  return navigateToRandomEditor;
};
