import React, { useState, useEffect } from "react";
import Joyride, { Step, CallBackProps, STATUS, EVENTS, ACTIONS } from "react-joyride";

interface TutorialProps {
    run: boolean;
    onFinish: () => void;
}

export const Tutorial: React.FC<TutorialProps> = ({ run, onFinish }) => {
    const [stepIndex, setStepIndex] = useState(0);
    const [steps] = useState<Step[]>([
        {
            target: ".search-input",
            content: "အရင်ဆုံး ဝယ်သူယူလာတဲ့ ပစ္စည်းကို စနစ်ထဲ ထည့်ရပါမယ်။ Screen ရဲ့ ဘယ်ဘက်အပေါ်က Search box မှာ ပစ္စည်းအမည်ကို ရိုက်ရှာပါ (ဒါမှမဟုတ်) Barcode ရှိရင် Scan ဖတ်လိုက်ပါ။",
            disableBeacon: true,
            spotlightClicks: true,
        },
        {
            target: ".product-item",
            content: "ပစ္စည်းပုံလေး ပေါ်လာပြီဆိုရင် အဲဒီအပေါ်မှာ တစ်ချက်နှိပ်လိုက်ပါ။ ညာဘက်ခြမ်းက 'Current Sale' ဆိုတဲ့ နေရာကို ပစ္စည်းရောက်သွားတာ မြင်ရပါလိမ့်မယ်။",
            spotlightClicks: true,
            hideNextButton: true, // Force user to click the product
        },
        {
            target: ".cart-item-controls",
            content: "အရေအတွက် ပြင်ချင်ရင်: ပစ္စည်းအမည်ဘေးက [+] နဲ့ [-] ကို သုံးပြီး အရေအတွက် အတိုးအလျှော့ လုပ်ပေးရုံပါပဲ။",
        },
        {
            target: ".start-btn",
            content: "၂။ ငွေပေးချေမှုစနစ်ထဲ ဝင်မယ် (Initiating Checkout)\nပစ္စည်းတွေ စုံပြီဆိုရင်တော့ ငွေတောင်းဖို့အတွက် Checkout စာမျက်နှာကို သွားပါမယ်။\nလုပ်ဆောင်ရန်: ညာဘက်အောက်ခြေက အပြာရောင်ခလုတ်ကြီး 'Proceed to Checkout' ကို နှိပ်လိုက်ပါ။\nဘာဖြစ်သွားမလဲ: ငွေရှင်းဖို့ အသေးစိတ်ဖြည့်ရမယ့် Pop-up window လေး ပွင့်လာပါလိမ့်မယ်။",
            spotlightClicks: true,
            hideNextButton: true, // Force user to click the button
        },
        {
            target: ".payment-type-select",
            content: "၃။ ငွေပေးချေမှုပုံစံ ရွေးမယ် (Payment Settings)\nဒီအဆင့်က အရမ်းအရေးကြီးပါတယ်၊ ဘာလို့လဲဆိုတော့ စာရင်းတွေ မလွဲအောင် သေချာရွေးပေးရလို့ပါ။\nPayment Type ကို အရင်ကြည့်ပါ: * ဝယ်သူက ငွေအကျေပေးရင် 'Paid' ကို ရွေးပါ။\nအကယ်၍ ဝယ်သူက အကြွေးယူတာဆိုရင် 'Credit' လို့ ပြောင်းရွေးပေးရပါမယ်။\nဘယ်လိုပေးမှာလဲ (Payment Method): * 'Paid' လို့ ရွေးလိုက်တာနဲ့ အောက်မှာ box အသစ်တစ်ခု ပေါ်လာမယ်။ ဝယ်သူက လက်ငင်းငွေသားပေးတာလား (Cash)၊ ဒါမှမဟုတ် KBZ Pay / Wave Pay တို့လို Digital Wallet တွေနဲ့ ပေးတာလားဆိုတာကို သေချာ ရွေးပေးပါ။",
        },
        {
            target: ".discount-input",
            content: "၄။ လျှော့စျေးနဲ့ ပေးချေငွေ ထည့်မယ် (Discount & Paid Amount)\nDiscount ပေးစရာရှိရင်: 'Discount (%)' ကွက်မှာ လျှော့ပေးမယ့် ရာခိုင်နှုန်းကို ရိုက်ထည့်ပါ။ စနစ်က ကျသင့်ငွေကို အလိုအလျောက် တွက်ပေးသွားပါလိမ့်မယ်။",
        },
        {
            target: ".paid-amount-input",
            content: "ဝယ်သူပေးတဲ့ငွေ (Paid Amount): ဝယ်သူဆီက လက်ခံရရှိတဲ့ ငွေပမာဏကို ရိုက်ထည့်ပါ။\nဥပမာ: ကျသင့်ငွေ ၅၀,၀၀၀ ကို ဝယ်သူက ၁ သိန်းတန်ပေးရင် ၁၀၀,၀၀၀ လို့ ရိုက်ထည့်လိုက်ပါ။ အောက်က 'Change' ဆိုတဲ့နေရာမှာ ဝယ်သူကို ပြန်အမ်းရမယ့် ၅၀,၀၀၀ ကို စနစ်က ပြပေးပါလိမ့်မယ်။",
        },
        {
            target: ".complete-sale-btn",
            content: "၅။ အရောင်းပိတ်သိမ်းမယ် (Complete Sale)\nအချက်အလက်တွေ အားလုံး မှန်ပြီဆိုရင်...\nအောက်က အပြာရောင် 'Complete Sale' ခလုတ်ကို နှိပ်လိုက်ပါ။ ဒါဆိုရင် အရောင်းစာရင်း သိမ်းဆည်းခြင်း အောင်မြင်သွားပါပြီ။",
        },
    ]);

    useEffect(() => {
        const handleProductAdded = () => {
            // If we are on the product-item step (index 1), advance to next step
            if (stepIndex === 1) {
                setStepIndex(2);
            }
        };

        const handleCheckoutInitiated = () => {
            // If we are on the start-btn step (index 3), advance to next step
            if (stepIndex === 3) {
                setStepIndex(4);
            }
        };

        window.addEventListener("product-added", handleProductAdded);
        window.addEventListener("checkout-initiated", handleCheckoutInitiated);
        return () => {
            window.removeEventListener("product-added", handleProductAdded);
            window.removeEventListener("checkout-initiated", handleCheckoutInitiated);
        };
    }, [stepIndex]);

    // Reset stepIndex when tour is started
    useEffect(() => {
        if (run) {
            setStepIndex(0);
        }
    }, [run]);

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { action, index, status, type } = data;

        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
            onFinish();
        } else if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
            setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
        }
    };

    return (
        <Joyride
            steps={steps}
            run={run}
            stepIndex={stepIndex}
            continuous
            showProgress
            showSkipButton
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    primaryColor: "#0ea5e9", // Adjust this to match your theme's primary color
                    textColor: "#333",
                    zIndex: 1000,
                },
                buttonNext: {
                    backgroundColor: "#0ea5e9",
                    color: "#fff",
                    borderRadius: "8px",
                    padding: "8px 16px",
                },
                buttonBack: {
                    marginRight: "10px",
                    color: "#666",
                },
                buttonSkip: {
                    color: "#999",
                },
            }}
            locale={{
                last: "Finish",
                next: "Next",
                back: "Back",
                skip: "Skip",
            }}
        />
    );
};
