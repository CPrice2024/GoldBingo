import api from "./axios";


export const getAvailableCards =
  async (limit = 20) => {

    const response =
      await api.get(
        "/cards/available/random",
        {
          params: {
            limit,
          },
        }
      );

    return response.data;

  };