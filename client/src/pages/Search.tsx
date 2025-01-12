import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SearchInput } from "@/components/SearchInput";
import { SearchResults } from "@/components/SearchResults";
import { FollowUpInput } from "@/components/FollowUpInput";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { ApiKeyButton } from "@/components/ApiKeyButton";
import { ApiKeyDialog } from "@/components/ApiKeyDialog";
import { ThemeToggle } from "@/components/ThemeToggle";

const API_KEY_STORAGE_KEY = "gemini-api-key";

interface SearchResponse {
	sessionId?: string;
	summary: string;
	sources: Array<{
		title: string;
		url: string;
		snippet: string;
	}>;
}

export function Search() {
	const [location, setLocation] = useLocation();
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [currentResults, setCurrentResults] = useState<SearchResponse | null>(
		null,
	);
	const [originalQuery, setOriginalQuery] = useState<string | null>(null);
	const [isFollowUp, setIsFollowUp] = useState(false);
	const [followUpQuery, setFollowUpQuery] = useState<string | null>(null);
	const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
	const { toast } = useToast();

	// Extract query from URL, handling both initial load and subsequent navigation
	const getQueryFromUrl = useCallback(() => {
		const searchParams = new URLSearchParams(window.location.search);
		return searchParams.get("q") || "";
	}, []);

	const [searchQuery, setSearchQuery] = useState(getQueryFromUrl);
	const [refetchCounter, setRefetchCounter] = useState(0);

	const { data, isLoading, error } = useQuery({
		queryKey: ["search", searchQuery, refetchCounter],
		queryFn: async () => {
			if (!searchQuery) return null;

			const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
			if (!apiKey) {
				setShowApiKeyDialog(true);
				return null;
			}

			const response = await fetch(
				`/api/search?q=${encodeURIComponent(searchQuery)}`,
				{
					headers: {
						"X-API-Key": apiKey,
					},
				},
			);
			if (!response.ok) {
				const error = await response.text();
				throw new Error(error);
			}
			const result = await response.json();
			if (result.sessionId) {
				setSessionId(result.sessionId);
				setCurrentResults(result);
				if (!originalQuery) {
					setOriginalQuery(searchQuery);
				}
				setIsFollowUp(false);
			}
			return result;
		},
		enabled: !!searchQuery,
	});

	// Follow-up mutation
	const followUpMutation = useMutation({
		mutationFn: async (followUpQuery: string) => {
			const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
			if (!apiKey) {
				setShowApiKeyDialog(true);
				throw new Error("Please set your API key first");
			}

			if (!sessionId) {
				const response = await fetch(
					`/api/search?q=${encodeURIComponent(followUpQuery)}`,
					{
						headers: {
							"X-API-Key": apiKey,
						},
					},
				);
				if (!response.ok) {
					const error = await response.text();
					throw new Error(error);
				}
				const result = await response.json();
				if (result.sessionId) {
					setSessionId(result.sessionId);
					setOriginalQuery(searchQuery);
					setIsFollowUp(false);
				}
				return result;
			}

			const response = await fetch("/api/follow-up", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-API-Key": apiKey,
				},
				body: JSON.stringify({
					sessionId,
					query: followUpQuery,
				}),
			});

			if (!response.ok) {
				if (response.status === 404) {
					const newResponse = await fetch(
						`/api/search?q=${encodeURIComponent(followUpQuery)}`,
						{
							headers: {
								"X-API-Key": apiKey,
							},
						},
					);
					if (!newResponse.ok) {
						const error = await newResponse.text();
						throw new Error(error);
					}
					const result = await newResponse.json();
					if (result.sessionId) {
						setSessionId(result.sessionId);
						setOriginalQuery(searchQuery);
						setIsFollowUp(false);
					}
					return result;
				}
				const error = await response.text();
				throw new Error(error);
			}

			const result = await response.json();
			return result;
		},
		onSuccess: (result) => {
			setCurrentResults(result);
			setIsFollowUp(true);
		},
	});

	const handleSearch = async (newQuery: string) => {
		if (newQuery === searchQuery) {
			// If it's the same query, increment the refetch counter to trigger a new search
			setRefetchCounter((c) => c + 1);
		} else {
			setSessionId(null); // Clear session on new search
			setOriginalQuery(null); // Clear original query
			setIsFollowUp(false); // Reset follow-up state
			setSearchQuery(newQuery);
		}
		// Update URL without triggering a page reload
		const newUrl = `/search?q=${encodeURIComponent(newQuery)}`;
		window.history.pushState({}, "", newUrl);
	};

	const handleFollowUp = async (newFollowUpQuery: string) => {
		setFollowUpQuery(newFollowUpQuery);
		await followUpMutation.mutateAsync(newFollowUpQuery);
	};

	const handleApiKeySuccess = () => {
		// Retrigger the search after API key is set
		setRefetchCounter((c) => c + 1);
	};

	// Automatically start search when component mounts or URL changes
	useEffect(() => {
		const query = getQueryFromUrl();
		if (query && query !== searchQuery) {
			setSessionId(null); // Clear session on URL change
			setOriginalQuery(null); // Clear original query
			setIsFollowUp(false); // Reset follow-up state
			setSearchQuery(query);
		}
	}, [getQueryFromUrl, searchQuery]);

	// Use currentResults if available, otherwise fall back to data from useQuery
	const displayResults = currentResults || data;

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.3 }}
			className="min-h-screen bg-background"
		>
			<motion.div
				initial={{ y: -20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ duration: 0.4 }}
				className="max-w-6xl mx-auto p-4"
			>
				<motion.div
					className="flex items-center gap-4 mb-6"
					initial={{ x: -20, opacity: 0 }}
					animate={{ x: 0, opacity: 1 }}
					transition={{ duration: 0.4, delay: 0.1 }}
				>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setLocation("/")}
						className="hidden sm:flex"
					>
						<ArrowLeft className="h-4 w-4" />
					</Button>

					<div className="w-full max-w-2xl">
						<SearchInput
							onSearch={handleSearch}
							initialValue={searchQuery}
							isLoading={isLoading}
							autoFocus={false}
							large={false}
						/>
					</div>

					<div className="flex items-center gap-2">
						<ApiKeyButton />
						<ThemeToggle />
					</div>
				</motion.div>

				<AnimatePresence mode="wait">
					<motion.div
						key={searchQuery}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						transition={{ duration: 0.3 }}
						className="flex flex-col items-stretch"
					>
						<SearchResults
							query={isFollowUp ? followUpQuery || "" : searchQuery}
							results={displayResults}
							isLoading={isLoading || followUpMutation.isPending}
							error={error || followUpMutation.error || undefined}
							isFollowUp={isFollowUp}
							originalQuery={originalQuery || ""}
						/>

						{displayResults && !isLoading && !followUpMutation.isPending && (
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.3, delay: 0.2 }}
								className="mt-6 max-w-2xl"
							>
								<FollowUpInput
									onSubmit={handleFollowUp}
									isLoading={followUpMutation.isPending}
								/>
							</motion.div>
						)}
					</motion.div>
				</AnimatePresence>
			</motion.div>

			<ApiKeyDialog
				open={showApiKeyDialog}
				onOpenChange={setShowApiKeyDialog}
				onSuccess={handleApiKeySuccess}
			/>
		</motion.div>
	);
}
