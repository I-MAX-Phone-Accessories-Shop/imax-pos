import axios from "axios";

/**
 * Fetch products from API
 * @returns {Promise<Object>} Response from API with products data
 */
export const fetchProducts = async () => {
  try {
    // Get API base URL from environment or use relative path
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
    const url = `${API_BASE_URL}/inventory`;

    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(response.data);

    // Axios automatically parses JSON, so response.data is already the parsed object
    return response.data;
  } catch (error) {
    console.error("Error fetching products:", error);

    // Handle axios-specific errors
    if (axios.isAxiosError(error)) {
      // Check if we got HTML instead of JSON (common when endpoint doesn't exist)
      if (
        error.response &&
        error.response.headers["content-type"] &&
        error.response.headers["content-type"].includes("text/html")
      ) {
        throw new Error(
          `API endpoint not found. Please check if the API is running and the endpoint "${error.config?.url}" is correct. If using a different API URL, set VITE_API_BASE_URL in your .env file.`
        );
      }

      // Handle HTTP error responses
      if (error.response) {
        const status = error.response.status;
        const errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          `HTTP error! status: ${status}`;
        throw new Error(errorMessage);
      }

      // Handle network errors
      if (error.request) {
        throw new Error(
          `Network error: Unable to reach the API. Please check if the API server is running and accessible at ${error.config?.url}.`
        );
      }
    }

    // Re-throw other errors
    throw error;
  }
};
