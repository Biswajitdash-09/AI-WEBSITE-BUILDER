import { FREE_CREDITS, PRO_CREDITS } from "@/lib/credits";
import { CheckIcon, XIcon } from "lucide-react";
import Link from "next/link";

const plans = [
    {
        name: "Free",
        price: "$0",
        period: "forever",
        description: "Perfect for trying out SiteForge",
        credits: FREE_CREDITS,
        features: [
            { text: `${FREE_CREDITS} credits per month`, included: true },
            { text: "AI code generation", included: true },
            { text: "Live preview", included: true },
            { text: "Code export", included: true },
            { text: "Priority support", included: false },
            { text: "Advanced models", included: false },
        ],
        cta: "Current Plan",
        highlighted: false,
    },
    {
        name: "Pro",
        price: "$19",
        period: "per month",
        description: "For serious builders",
        credits: PRO_CREDITS,
        features: [
            { text: `${PRO_CREDITS} credits per month`, included: true },
            { text: "AI code generation", included: true },
            { text: "Live preview", included: true },
            { text: "Code export", included: true },
            { text: "Priority support", included: true },
            { text: "Advanced models", included: true },
        ],
        cta: "Upgrade to Pro",
        highlighted: true,
    },
];

export default function PricingPage() {
    return (
        <div className="flex flex-col items-center px-4 py-16 gap-12">
            <div className="flex flex-col items-center gap-4 text-center">
                <h1 className="text-4xl font-bold tracking-tight">
                    Simple, transparent pricing
                </h1>
                <p className="text-muted-foreground text-lg max-w-md">
                    Start building for free. Upgrade when you need more power.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
                {plans.map((plan) => (
                    <div
                        key={plan.name}
                        className={`relative flex flex-col rounded-2xl border p-8 ${plan.highlighted
                            ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                            : "border-border bg-card"
                            }`}
                    >
                        {plan.highlighted && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                                Most Popular
                            </div>
                        )}

                        <div className="mb-6">
                            <h2 className="text-xl font-semibold">{plan.name}</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                {plan.description}
                            </p>
                        </div>

                        <div className="mb-6">
                            <span className="text-4xl font-bold">{plan.price}</span>
                            <span className="text-muted-foreground ml-1">
                                /{plan.period}
                            </span>
                        </div>

                        <ul className="flex flex-col gap-3 mb-8 flex-1">
                            {plan.features.map((feature) => (
                                <li
                                    key={feature.text}
                                    className="flex items-center gap-2 text-sm"
                                >
                                    {feature.included ? (
                                        <CheckIcon className="h-4 w-4 text-primary shrink-0" />
                                    ) : (
                                        <XIcon className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                                    )}
                                    <span
                                        className={
                                            feature.included
                                                ? ""
                                                : "text-muted-foreground/50"
                                        }
                                    >
                                        {feature.text}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        {plan.highlighted ? (
                            <Link
                                href="/sign-up"
                                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                                {plan.cta}
                            </Link>
                        ) : (
                            <div className="inline-flex items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium text-muted-foreground">
                                {plan.cta}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
