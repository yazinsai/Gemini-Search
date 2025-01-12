import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const API_KEY_STORAGE_KEY = "gemini-api-key";

interface ApiKeyDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function ApiKeyDialog({
	open,
	onOpenChange,
	onSuccess,
}: ApiKeyDialogProps) {
	const [apiKey, setApiKey] = useState("");
	const { toast } = useToast();

	const handleSave = () => {
		if (!apiKey.trim()) {
			toast({
				title: "Error",
				description: "Please enter a valid API key",
				variant: "destructive",
			});
			return;
		}

		localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
		toast({
			title: "Success",
			description: "API key saved successfully",
		});
		onSuccess?.();
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Enter API Key</DialogTitle>
					<DialogDescription>
						Please enter your Google API key to use the search functionality.
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-4">
					<Input
						type="password"
						value={apiKey}
						onChange={(e) => setApiKey(e.target.value)}
						placeholder="Enter your Google API key"
						className="flex-1"
					/>
					<Button onClick={handleSave}>Save API Key</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
