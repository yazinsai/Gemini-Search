import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Key } from "lucide-react";
import { ApiKeyDialog } from "./ApiKeyDialog";

const API_KEY_STORAGE_KEY = "gemini-api-key";

export function ApiKeyButton() {
	const [hasKey, setHasKey] = useState(false);
	const [showDialog, setShowDialog] = useState(false);

	useEffect(() => {
		const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
		setHasKey(!!storedKey);
	}, []);

	const handleSuccess = () => {
		setHasKey(true);
	};

	return (
		<>
			<Button
				variant="ghost"
				size="icon"
				onClick={() => setShowDialog(true)}
				className={hasKey ? "text-muted-foreground" : "text-destructive"}
				title={hasKey ? "Edit API Key" : "Set API Key"}
			>
				<Key className="h-4 w-4" />
			</Button>
			<ApiKeyDialog
				open={showDialog}
				onOpenChange={setShowDialog}
				onSuccess={handleSuccess}
			/>
		</>
	);
}
