// import { jwtDecode } from "jwt-decode";

// // Export a function instead of a static value
// const getUserDetails = () => {
//   try {
//     const authDataString = sessionStorage.getItem("token");
//     if (authDataString) {
//       const authData = JSON.parse(authDataString);
//       const idToken = authData?.auth_response?.AuthenticationResult?.IdToken;
//       if (idToken) {
//         const decoded = jwtDecode(idToken);
//         return decoded["cognito:username"];
//       }
//     }
//     return null;
//   } catch (error) {
//     console.error("Error getting user details:", error);
//     return null;
//   }
// };

// export default getUserDetails;


import { jwtDecode } from "jwt-decode";

// Export a function instead of a static value
const getUserDetails = () => {
  try {
    const authDataString = sessionStorage.getItem("token");
    if (authDataString) {
      const authData = JSON.parse(authDataString);
      const accessToken =
        authData?.auth_response?.AuthenticationResult?.AccessToken;
      if (accessToken) {
        const decoded = jwtDecode(accessToken);
        return decoded.username;
      }
    }
    return null;
  } catch (error) {
    console.error("Error getting user details:", error);
    return null;
  }
};

export default getUserDetails;
