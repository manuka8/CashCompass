import React from "react"
import {
    Home,
    Utensils,
    Car,
    Lightbulb,
    ShoppingBag,
    HeartPulse,
    GraduationCap,
    Film,
    Plane,
    Scissors,
    CreditCard,
    Package,
    Receipt,
} from "lucide-react-native"

const CATEGORY_ICON_MAP = {
    Housing: Home,
    "Food & Dining": Utensils,
    Transportation: Car,
    "Bills & Utilities": Lightbulb,
    Shopping: ShoppingBag,
    "Health & Medical": HeartPulse,
    Education: GraduationCap,
    Entertainment: Film,
    Travel: Plane,
    "Personal Care": Scissors,
    Financial: CreditCard,
    Others: Package,
}

export function getCategoryIconComponent(category) {
    return CATEGORY_ICON_MAP[category] || Receipt
}

export default function CategoryIcon({
    category,
    size = 20,
    color = "#2ECC71",
    strokeWidth = 2,
}) {
    const IconComponent = getCategoryIconComponent(category)
    return <IconComponent size={size} color={color} strokeWidth={strokeWidth} />
}
