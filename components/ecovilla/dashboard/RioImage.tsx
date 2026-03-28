import Image from "next/image"
import { cn } from "@/lib/utils"

interface RioImageProps {
    pose?: "general" | "encouraging" | "waiting" | "icon"
    className?: string
    size?: "xs" | "sm" | "md" | "lg" | "xl"
}

export function RioImage({ pose = "general", className, size = "md" }: RioImageProps) {
    // Map sizes to dimensions
    const dimensions = {
        xs: { width: 32, height: 32 },
        sm: { width: 48, height: 48 },
        md: { width: 120, height: 120 },
        lg: { width: 200, height: 200 },
        xl: { width: 300, height: 300 }
    }

    const { width, height } = dimensions[size]

    // Use the new parrot image
    const imagePath = "/rio/parrot.png"

    return (
        <div className={cn("relative flex items-center justify-center", className)}>
            <Image
                src={imagePath}
                alt="Rio the Macaw"
                width={width}
                height={height}
                className="object-contain"
                priority={size === "lg" || size === "xl"}
            />
        </div>
    )
}
