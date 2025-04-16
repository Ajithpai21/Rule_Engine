import { jwtDecode } from "jwt-decode";

const getUserDetails = () => {
  try {
    const accessToken = sessionStorage.getItem("token");
    if (accessToken) {
      const decoded = jwtDecode(accessToken);
      return decoded.username;
    }
  } catch (error) {
    console.error("Error getting user details:", error);
    return null;
  }
};

export default getUserDetails;
