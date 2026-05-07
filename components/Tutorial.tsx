import React, { useState, useEffect } from "react";
import Joyride, {
  Step,
  CallBackProps,
  STATUS,
  EVENTS,
  ACTIONS,
} from "react-joyride";

type EventData = CallBackProps;

interface TutorialProps {
  run: boolean;
  onFinish: () => void;
  tourType: "pos" | "inventory";
}

export const Tutorial: React.FC<TutorialProps> = ({
  run,
  onFinish,
  tourType,
}) => {
  const [stepIndex, setStepIndex] = useState(0);

  const posSteps: Step[] = [
    {
      target: "body",
      content:
        "မင်္ဂလာပါဗျာ။ ဒီနေ့ ကျွန်တော်တို့ AutoShop စနစ်ထဲမှာ ဝယ်သူကို ပစ္စည်းရောင်းပြီး ငွေဘယ်လိုရှင်းမလဲဆိုတဲ့ Checkout လုပ်ငန်းစဉ်ကို လက်တွေ့ လေ့ကျင့်ကြည့်ပါမယ်။ အရောင်းဝန်ထမ်းတစ်ယောက်အနေနဲ့ အမှားအယွင်းမရှိအောင် ဒီအဆင့်တွေကို အတူတူ လိုက်လုပ်ကြည့်ရအောင်။",
      placement: "center",
    },
    {
      target: ".search-input",
      content:
        "အရင်ဆုံး ဝယ်သူယူလာတဲ့ ပစ္စည်းကို စနစ်ထဲ ထည့်ရပါမယ်။ Screen ရဲ့ ဘယ်ဘက်အပေါ်က Search box မှာ ပစ္စည်းအမည်ကို ရိုက်ရှာပါ (ဒါမှမဟုတ်) Barcode ရှိရင် Scan ဖတ်လိုက်ပါ။",
      disableBeacon: true,
      spotlightClicks: true,
    },
    {
      target: ".product-item",
      content:
        "ပစ္စည်းပုံလေး ပေါ်လာပြီဆိုရင် အဲဒီအပေါ်မှာ တစ်ချက်နှိပ်လိုက်ပါ။ ညာဘက်ခြမ်းက 'Current Sale' ဆိုတဲ့ နေရာကို ပစ္စည်းရောက်သွားတာ မြင်ရပါလိမ့်မယ်။",
      spotlightClicks: true,
    },
    {
      target: ".cart-item-controls",
      content:
        "အရေအတွက် ပြင်ချင်ရင်: ပစ္စည်းအမည်ဘေးက [+] နဲ့ [-] ကို သုံးပြီး အရေအတွက် အတိုးအလျှော့ လုပ်ပေးရုံပါပဲ။",
    },
    {
      target: ".start-btn",
      content:
        "၂။ ငွေပေးချေမှုစနစ်ထဲ ဝင်မယ် (Initiating Checkout)\nပစ္စည်းတွေ စုံပြီဆိုရင်တော့ ငွေတောင်းဖို့အတွက် Checkout စာမျက်နှာကို သွားပါမယ်။\nလုပ်ဆောင်ရန်: ညာဘက်အောက်ခြေက အပြာရောင်ခလုတ်ကြီး 'Proceed to Checkout' ကို နှိပ်လိုက်ပါ။\nဘာဖြစ်သွားမလဲ: ငွေရှင်းဖို့ အသေးစိတ်ဖြည့်ရမယ့် Pop-up window လေး ပွင့်လာပါလိမ့်မယ်။",
      spotlightClicks: true,
    },
    {
      target: ".payment-type-select",
      content:
        "၃။ ငွေပေးချေမှုပုံစံ ရွေးမယ် (Payment Settings)\nဒီအဆင့်က အရမ်းအရေးကြီးပါတယ်၊ ဘာလို့လဲဆိုတော့ စာရင်းတွေ မလွဲအောင် သေချာရွေးပေးရလို့ပါ။\nPayment Type ကို အရင်ကြည့်ပါ: * ဝယ်သူက ငွေအကျေပေးရင် 'Paid' ကို ရွေးပါ။\nအကယ်၍ ဝယ်သူက အကြွေးယူတာဆိုရင် 'Credit' လို့ ပြောင်းရွေးပေးရပါမယ်။\nဘယ်လိုပေးမှာလဲ (Payment Method): * 'Paid' လို့ ရွေးလိုက်တာနဲ့ အောက်မှာ box အသစ်တစ်ခု ပေါ်လာမယ်။ ဝယ်သူက လက်ငင်းငွေသားပေးတာလား (Cash)၊ ဒါမှမဟုတ် KBZ Pay / Wave Pay တို့လို Digital Wallet တွေနဲ့ ပေးတာလားဆိုတာကို သေချာ ရွေးပေးပါ။",
    },
    {
      target: ".discount-input",
      content:
        "၄။ လျှော့စျေးနဲ့ ပေးချေငွေ ထည့်မယ် (Discount & Paid Amount)\nDiscount ပေးစရာရှိရင်: 'Discount (%)' ကွက်မှာ လျှော့ပေးမယ့် ရာခိုင်နှုန်းကို ရိုက်ထည့်ပါ။ စနစ်က ကျသင့်ငွေကို အလိုအလျောက် တွက်ပေးသွားပါလိမ့်မယ်။",
    },
    {
      target: ".paid-amount-input",
      content:
        "ဝယ်သူပေးတဲ့ငွေ (Paid Amount): ဝယ်သူဆီက လက်ခံရရှိတဲ့ ငွေပမာဏကို ရိုက်ထည့်ပါ။\nဥပမာ: ကျသင့်ငွေ ၅၀,၀၀၀ ကို ဝယ်သူက ၁ သိန်းတန်ပေးရင် ၁၀၀,၀၀၀ လို့ ရိုက်ထည့်လိုက်ပါ။ အောက်က 'Change' ဆိုတဲ့နေရာမှာ ဝယ်သူကို ပြန်အမ်းရမယ့် ၅၀,၀၀၀ ကို စနစ်က ပြပေးပါလိမ့်မယ်။",
    },
    {
      target: ".complete-sale-btn",
      content:
        "၅။ အရောင်းပိတ်သိမ်းမယ် (Complete Sale)\nအချက်အလက်တွေ အားလုံး မှန်ပြီဆိုရင်...\nအောက်က အပြာရောင် 'Complete Sale' ခလုတ်ကို နှိပ်လိုက်ပါ။ ဒါဆိုရင် အရောင်းစာရင်း သိည်းဆည်းခြင်း အောင်မြင်သွားပါပြီ။",
    },
  ];

  const inventorySteps: Step[] = [
    {
      target: "body",
      content:
        "ကဲ... အခု ကျွန်တော်တို့ ဆိုင်ရဲ့ အသက်သွေးကြောဖြစ်တဲ့ ပစ္စည်းစာရင်း (Inventory) ကို ဘယ်လို စီမံမလဲဆိုတာ လေ့လာကြည့်ပါမယ်။ ပစ္စည်းအသစ်ထည့်တာ၊ ရှိပြီးသားစာရင်းကို စစ်တာနဲ့ ပစ္စည်းတွေကို ဂိုဒေါင်ကနေ ဆိုင်ရှေ့အရောင်းကောင်တာဆီ ရွှေ့တာတွေကို အတူတူ လုပ်ကြည့်ပါမယ်။",
      placement: "center",
    },
    {
      target: ".inventory-add-product-btn",
      content:
        "၁။ ပစ္စည်းအသစ်စာရင်းသွင်းမယ် (Add New Product)\nဆိုင်ကို ပစ္စည်းအသစ်ရောက်လာရင် စနစ်ထဲမှာ အရင်ဆုံး နာမည်သွင်းရပါမယ်။\nလုပ်ဆောင်ချက်: အပြာရောင် '+ Add Product' ခလုတ်ကို နှိပ်လိုက်ပါ။\nဖြည့်သွင်းရန်:\nProduct Name: ပစ္စည်းအမည် (ဥပမာ - FQ9 PLUS ANC)။\nBarcode & Product Code: ဘားကုဒ်ဖတ်စက်နဲ့ စကန်ဖတ်ပါ (သို့မဟုတ်) ကုဒ်နံပါတ် ရိုက်ထည့်ပါ။\nCategory & Brand: ပစ္စည်းအမျိုးအစားနဲ့ တံဆိပ်ကို ရွေးပါ။\nPrices: ပစ္စည်းရင်းစျေး (Buying Price) နဲ့ ရောင်းစျေး (Selling Price) ကို သေချာအောင် ဖြည့်ပါ။\nအတည်ပြုရန်: အအားလုံးပြီးရင် 'Save Product' ကို နှိပ်ပြီး သိမ်းလိုက်ပါ။",
    },
    {
      target: ".inventory-view-btn",
      content:
        "၂။ ပစ္စည်းအသေးစိတ်ကို စစ်ဆေးမယ် (View Product Details)\nရှိပြီးသားပစ္စည်းတစ်ခုရဲ့ အချက်အလက် ဒါမှမဟုတ် အရေအတွက် ဘယ်လောက်ကျန်သေးလဲဆိုတာကို ကြည့်ချင်ရင် View ကို သုံးပါတယ်။\nလုပ်ဆောင်ချက်: 'View' ခလုတ်ကို နှိပ်ပါ။\nကြည့်ရှုနိုင်သည်များ:\nAbout Product: ပစ္စည်းအမည်၊ ကုဒ်နဲ့ စျေးနှုန်းတွေကို ပြန်စစ်လို့ရတယ်။\nProduct Quantity: ပစ္စည်းစုစုပေါင်း ဘယ်လောက်ရှိလဲ၊ ဆိုင်ရှေ့ (Storefront) မှာ ဘယ်လောက်၊ ဂိုဒေါင် (Warehouse) မှာ ဘယ်လောက်ကျန်လဲဆိုတာ တိတိကျကျ မြင်ရပါလိမ့်မယ်။",
    },
    {
      target: ".inventory-refresh-btn",
      content:
        "ပစ္စည်းစာရင်းတွေကို အသစ်ပြန်ဖြစ်သွားအောင် Refresh လုပ်နိုင်ပါတယ်။",
    },
    {
      target: ".inventory-transfer-warehouse-btn",
      content: "ပစ္စည်းတွေကို ဂိုဒေါင်ဆီ ပြန်ပို့ချင်ရင် ဒီခလုတ်ကို သုံးပါ။",
    },
    {
      target: ".inventory-transfer-storefront-btn",
      content:
        "ဂိုဒေါင်က ပစ္စည်းတွေကို ဆိုင်ရှေ့အရောင်းကောင်တာဆီ ပို့ချင်ရင် ဒီခလုတ်ကို သုံးပါ။",
    },
    {
      target: ".inventory-add-product-btn",
      content: "ပစ္စည်းအသစ်ထည့်ချင်ရင် ဒီခလုတ်ကို နှိပ်လိုက်ပါ။",
    },
    {
      target: ".inventory-search-input",
      content: "ဒီမှာ ပစ္စည်းအမည်၊ Barcode နဲ့ ရှာဖွေနိုင်ပါတယ်။",
    },
    {
      target: ".inventory-category-filter",
      content: "ပစ္စည်းအမျိုးအစားအလိုက် စစ်ထုတ်ကြည့်နိုင်ပါတယ်။",
    },
    {
      target: ".inventory-table",
      content:
        "ဒီမှာတော့ ရှိသမျှ ပစ္စည်းစာရင်းအားလုံးကို အသေးစိတ် ကြည့်နိုင်ပါတယ်။",
    },
  ];

  const steps = tourType === "pos" ? posSteps : inventorySteps;

  useEffect(() => {
    if (tourType !== "pos") return;

    const handleProductAdded = () => {
      if (stepIndex === 2) setStepIndex(3);
    };

    const handleCheckoutInitiated = () => {
      if (stepIndex === 4) setStepIndex(5);
    };

    window.addEventListener("product-added", handleProductAdded);
    window.addEventListener("checkout-initiated", handleCheckoutInitiated);
    return () => {
      window.removeEventListener("product-added", handleProductAdded);
      window.removeEventListener("checkout-initiated", handleCheckoutInitiated);
    };
  }, [stepIndex, tourType]);

  // Reset stepIndex when tour is started or tourType changes
  useEffect(() => {
    if (run) {
      setStepIndex(0);
    }
  }, [run, tourType]);

  const handleJoyrideCallback = (data: EventData) => {
    const { action, index, status, type } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      onFinish();
    } else if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    }
  };

  return (
    <Joyride
      steps={steps as any}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "#2216a8",
          textColor: "#333",
          zIndex: 1000,
        },
        tooltip: {
          width: 500,
          padding: 20,
        },
        buttonNext: {
          backgroundColor: "#2216a8",
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
