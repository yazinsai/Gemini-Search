import { QueryClient } from "@tanstack/react-query";

const API_KEY_STORAGE_KEY = "gemini-api-key";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			queryFn: async ({ queryKey }) => {
				const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
				const res = await fetch(queryKey[0] as string, {
					credentials: "include",
					headers: {
						"X-API-Key": apiKey || "",
					},
				});

				if (!res.ok) {
					if (res.status >= 500) {
						throw new Error(`${res.status}: ${res.statusText}`);
					}

					throw new Error(`${res.status}: ${await res.text()}`);
				}

				return res.json();
			},
			refetchInterval: false,
			refetchOnWindowFocus: false,
			staleTime: 1000 * 60,
			retry: false,
		},
		mutations: {
			retry: false,
		},
	},
});
