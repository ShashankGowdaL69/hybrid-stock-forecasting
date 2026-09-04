interface ShapProps {
    shap: {
        feature: string;
        value: number;
    }[];
    explanation: string;
}
declare const ShapExplanation: React.FC<ShapProps>;
export default ShapExplanation;
