import api from "./axios";


export const getAvailableCards =
  async () => {

    const response =
      await api.get(
        "/cards",
        {
          params: {
            status:
              "available",
          },
        }
      );


    return response.data;

  };