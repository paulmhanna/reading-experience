// Question schemas for both graded sections plus expression/research.
// Each question carries its own grader. Total points are computed dynamically.

export type AnswerValue =
  | string
  | string[]
  | Record<string, string>
  | undefined;

export interface Option {
  id: string;
  label: string;
  correct?: boolean;
}

export type QuestionType =
  | "single"
  | "multi"
  | "subgroup" // multiple sub-questions, each single-choice
  | "freeText" // ungraded or per-token grading
  | "tokenCorrection" // multiple input fields, exact-match per token
  | "tableFill"
  | "longText"
  | "correctedWords" // single textarea: list of expected corrected words
  | "finalHarakaTokens"; // multiple inputs: grade only by final haraka of each target word

export interface SubQuestion {
  id: string;
  prompt: string;
  options: Option[];
  type?: "single" | "multi";
}

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  helper?: string;
  context?: string;
  options?: Option[];
  subs?: SubQuestion[];
  // For tokenCorrection / tableFill
  tokens?: { id: string; label: string; expected: string; help?: string }[];
  tableColumns?: string[];
  tableRows?: { id: string; label: string; cells: { col: string; expected: string; given?: string }[] }[];
  // Free text expected (used as guidance/show after submit)
  expected?: string;
  // For correctedWords questions
  expectedWords?: string[];
  // Maximum points (defaults: 1 for single, options.filter(correct).length for multi, etc.)
  maxPoints?: number;
}

export interface Section {
  id: string;
  title: string;
  graded: boolean;
  questions: Question[];
}

// =====================================================================
// SECTION 1 — في الفهم والتحليل
// =====================================================================
const section1: Section = {
  id: "comprehension",
  title: "في الفَهمِ والتَّحليلِ",
  graded: true,
  questions: [
    {
      id: "q1",
      type: "subgroup",
      prompt: "اِخْتَرِ المعنى المطابِق لكلٍّ من المفردات الآتية:",
      subs: [
        {
          id: "1A",
          prompt: "تفوتني:",
          options: [
            { id: "a", label: "أخسرها", correct: true },
            { id: "b", label: "تُدخلني" },
            { id: "c", label: "تسبقني" },
          ],
        },
        {
          id: "1B",
          prompt: "تغصّ:",
          options: [
            { id: "a", label: "منحصرة" },
            { id: "b", label: "ممتلئة", correct: true },
            { id: "c", label: "مزيّنة" },
          ],
        },
        {
          id: "1C",
          prompt: "الغفيرة:",
          options: [
            { id: "a", label: "المنهمكة" },
            { id: "b", label: "المحترمة" },
            { id: "c", label: "الكثيرة", correct: true },
          ],
        },
      ],
    },
    {
      id: "q2",
      type: "subgroup",
      prompt: "حدّد مناسبة الحدث في هذا النّصّ، ومكانه.",
      subs: [
        {
          id: "2A",
          prompt: "المناسبة:",
          options: [
            { id: "a", label: "مباراة ودّيّة" },
            { id: "b", label: "مباراة مدرسيّة" },
            { id: "c", label: "مباراة كأس لبنان", correct: true },
          ],
        },
        {
          id: "2B",
          prompt: "المكان:",
          options: [
            { id: "a", label: "ساحة الضّيعة" },
            { id: "b", label: "الملعب", correct: true },
            { id: "c", label: "الحديقة العامّة" },
          ],
        },
      ],
    },
    {
      id: "q3",
      type: "subgroup",
      prompt: "حدّد الرّاوي.",
      subs: [
        {
          id: "3A",
          prompt: "من هو الرّاوي؟",
          options: [
            { id: "a", label: "صديق الكاتب" },
            { id: "b", label: "الكاتب", correct: true },
            { id: "c", label: "شخص آخر" },
          ],
        },
        {
          id: "3B",
          prompt: "هل ترى له حضورًا في النّصّ؟",
          options: [
            { id: "a", label: "نعم", correct: true },
            { id: "b", label: "لا" },
          ],
        },
        {
          id: "3C",
          prompt: "اختر الأفعال الّتي تثبت إجابتك:",
          type: "multi",
          options: [
            { id: "a", label: "توجّهتُ", correct: true },
            { id: "b", label: "انطلقتْ" },
            { id: "c", label: "وصلتُ", correct: true },
            { id: "d", label: "وقفَ" },
            { id: "e", label: "فوجئتُ", correct: true },
            { id: "f", label: "تتالى" },
          ],
        },
      ],
    },
    {
      id: "q4",
      type: "single",
      prompt: "بماذا تفاجأ الكاتب عندما وصل إلى الملعب؟",
      options: [
        { id: "a", label: "بوجود الملعب فارغًا" },
        { id: "b", label: "بوجود مئات المشجّعين" },
        { id: "c", label: "بوجود آلاف المشجّعين", correct: true },
      ],
    },
    {
      id: "q5",
      type: "single",
      prompt: "ماذا حصل بعد دخول الفريقين الملعب؟",
      options: [
        { id: "a", label: "ساد الصّمت" },
        { id: "b", label: "جلس المشجّعون" },
        { id: "c", label: "عمّت الحماسة", correct: true },
      ],
    },
    {
      id: "q6",
      type: "subgroup",
      prompt:
        "اختر من المفردات والعبارات الآتية ما ينتمي إلى الحقل المعجميّ للمباراة الرّياضيّة، وبيّن وظيفة هذا الحقل (الفقرة الثّانية).",
      subs: [
        {
          id: "6A",
          prompt: "اختر مفردات الحقل المعجميّ:",
          type: "multi",
          options: [
            { id: "a", label: "لاعبو فريقنا", correct: true },
            { id: "b", label: "استيقظوا" },
            { id: "c", label: "القلوب" },
            { id: "d", label: "الفريق المنافس", correct: true },
            { id: "e", label: "هبّ مشجّعوه", correct: true },
            { id: "f", label: "الهتافات الصّاخبة", correct: true },
            { id: "g", label: "تلوّح بالأعلام", correct: true },
            { id: "h", label: "الأسبوع" },
            { id: "i", label: "الأناشيد الخاصّة", correct: true },
            { id: "j", label: "عندئذٍ" },
            { id: "k", label: "الجماهير الغفيرة", correct: true },
            { id: "l", label: "فحيّاها اللاعبون", correct: true },
            { id: "m", label: "انحناءة جماعيّة", correct: true },
            { id: "n", label: "تصافحوا", correct: true },
            { id: "o", label: "انتشروا في الملعب", correct: true },
            { id: "p", label: "بعد" },
            { id: "q", label: "ثمّ" },
          ],
        },
        {
          id: "6B",
          prompt: "وظيفة الحقل المعجميّ — اعتمد الكاتب هذا الحشد اللّفظيّ:",
          options: [
            { id: "a", label: "لوصف مشهد رياضيّ، وإبراز حماسة المشجّعين", correct: true },
            { id: "b", label: "للدّلالة على المهارة والتّنظيم" },
            { id: "c", label: "لوصف الملعب والجمهور" },
          ],
        },
      ],
    },
    {
      id: "q7",
      type: "subgroup",
      prompt:
        "كثرت الأفعال في الفقرة الثّالثة: خرقت – يلاحقون – يندفعون – يعودون – ارتطمت – يستمرّ. حدّد نوعها:",
      subs: [
        {
          id: "7A",
          prompt: "نوع الأفعال:",
          options: [
            { id: "a", label: "هي أفعال حركيّة", correct: true },
            { id: "b", label: "هي أفعال سكونية" },
          ],
        },
        {
          id: "7B",
          prompt: "ما دورها في النّصّ؟",
          options: [
            {
              id: "a",
              label: "تصف المشاهد المتحرّكة، وتضفي عليها التّشويق والحماسة والحيويّة",
              correct: true,
            },
            { id: "b", label: "تجعل الأحداث افتراضيّة، خياليّة جميلة، وتعدّد المشاهد" },
            { id: "c", label: "تبقي الأحداث ثابتة هادئة واضحة وتشمل الجميع" },
          ],
        },
      ],
    },
    {
      id: "q8",
      type: "multi",
      prompt:
        "وردت التّراكيب الآتية في الفقرة الرّابعة: القلوب تخفق - العيون تحدّق - الأعناق تشرئبّ - الحماسة تزداد. اختر الإجابات الّتي تبيّن دورها في السّياق:",
      options: [
        { id: "a", label: "تولّد الإيقاع", correct: true },
        { id: "b", label: "تصف بدقّة وتفصيل", correct: true },
        { id: "c", label: "تعكس الهدوء والسّكينة" },
        { id: "d", label: "تدلّ على التّرقّب", correct: true },
        { id: "e", label: "تصف الملعب" },
      ],
    },
    {
      id: "q9",
      type: "subgroup",
      prompt:
        "الصورة البيانيّة: «الجماهير الغفيرة تلوّح بالأعلام، حتّى تراءت للنّاظر إليها كسهول القمح المتماوجة».",
      subs: [
        {
          id: "9A",
          prompt: "نوع الصورة:",
          options: [
            { id: "a", label: "تشبيه", correct: true },
            { id: "b", label: "استعارة" },
            { id: "c", label: "كناية" },
          ],
        },
        {
          id: "9B",
          prompt: "وظيفة الصّورة:",
          options: [
            {
              id: "a",
              label:
                "للدّلالة على نظافة المدرّجات ومساحتها الواسعة وجمال تمايلها.",
            },
            {
              id: "b",
              label: "للدّلالة على وقوف المشجّعين وكثرة عددهم وتنافسهم وتشاجرهم.",
            },
            {
              id: "c",
              label:
                "للدّلالة على كثرة الجماهير وامتدادها الواسع وتناسق تمايلها، ولجعل المشهد لوحة فنّيّة نابضة بالحيويّة والجمال، تكسب النّصّ إيحاءً وتأثيرًا.",
              correct: true,
            },
          ],
        },
      ],
    },
    {
      id: "q10",
      type: "subgroup",
      prompt:
        "الصورة البيانيّة: «حتّى يتمكّن أحد اللاعبين من اقتحام سلّة منافسيه وإرغامها على ابتلاع الكرة عنوةً».",
      subs: [
        {
          id: "10A",
          prompt: "نوع الصورة:",
          options: [
            { id: "a", label: "تشبيه" },
            { id: "b", label: "استعارة", correct: true },
            { id: "c", label: "كناية" },
          ],
        },
        {
          id: "10B",
          prompt: "الوظيفة الدّلاليّة والفنّيّة للصّورة:",
          options: [
            {
              id: "a",
              label:
                "تشخيص السّلّة وجعلها تُرغم وتبتلع كالإنسان للدلالة على نزاهة الحكم وسرعة اللاعب وكثرة المشاهدين.",
            },
            {
              id: "b",
              label:
                "اعتمد الكاتب هذه الاستعارة لتشخيص السّلّة وتحويلها إلى كائن حيّ يُقهر، للدّلالة على قوّة اللاعب ومهارته وتأكيد تسجيل الهدف، ولتحويل المشهد الوصفيّ إلى لوحة فنّيّة مفعمة بالجمال والتّحدّي والتّأثير.",
              correct: true,
            },
            {
              id: "c",
              label:
                "تشخيص السّلّة وجعلها تُرغم وتبتلع كالإنسان للدّلالة على تحديد الوقت الباقي للمباراة وإبراز طول قامة اللاعب.",
            },
          ],
        },
      ],
    },
    {
      id: "q11",
      type: "single",
      prompt:
        "حدّد المعنى الّذي قصده الكاتب في الجملة الآتية: «ويُودِعُ الكرة في جوف السّلّة المنافسة» (الفقرة الخامسة).",
      options: [
        { id: "a", label: "يقفز اللاعب إلى السّلّة" },
        { id: "b", label: "يرمي اللاعب الكرة إلى السّلّة" },
        { id: "c", label: "يسجّل اللاعب هدفًا في السّلّة", correct: true },
      ],
    },
    {
      id: "q12",
      type: "single",
      prompt: "حدّد السّلوك الّذي تجلّت فيه الرّوح الرّياضيّة:",
      options: [
        { id: "a", label: "تَصَافُحُ اللاعبين المتنافسين", correct: true },
        { id: "b", label: "الانتشار في الملعب" },
        { id: "c", label: "تحيّة الحاضرين" },
      ],
    },
    {
      id: "q13",
      type: "subgroup",
      prompt: "اختر من العبارات الآتية ما يتوافق مع الرّوح الرّياضيّة:",
      subs: [
        {
          id: "13A",
          prompt: "إذا خسرتُ في مباراة ما، أو خسر الفريق الّذي أشجّعه:",
          options: [
            { id: "a", label: "أخاصم الرّابح" },
            { id: "b", label: "أتقبّل الخسارة", correct: true },
            { id: "c", label: "أتحسّر على الخسارة" },
          ],
        },
        {
          id: "13B",
          prompt: "إذا خسر الآخر:",
          options: [
            { id: "a", label: "أتنمّر عليه" },
            { id: "b", label: "أحترم شعوره", correct: true },
            { id: "c", label: "أتجاهله" },
          ],
        },
      ],
    },
    {
      id: "q14",
      type: "single",
      prompt: "اختر النّتيجة الّتي توصّلت إليها.",
      options: [
        { id: "a", label: "الرّبح هو نتيجة الصّدفة" },
        { id: "b", label: "الرّبح هو نتيجة الاتّكال على الغير" },
        { id: "c", label: "الرّبح هو نتيجة التّعب والجدّ", correct: true },
      ],
    },
  ],
};

// =====================================================================
// SECTION 2 — في القواعد
// =====================================================================
const section2: Section = {
  id: "grammar",
  title: "في القَواعِدِ",
  graded: true,
  questions: [
    {
      id: "g1",
      type: "correctedWords",
      prompt:
        "عُد إلى النّصّ ثمّ صحّح الأخطاء الواردة في الجمل الآتية. (اكتب الكلمات المصحَّحة فقط، لا تكتب الجمل كلّها — افصل بين الكلمات بمسافة أو فاصلة)",
      context: "دخل لاعبوا فريقنا – فهبّ مشجعيه لاستقباله – ثم انتشرو في الملعب.",
      expectedWords: ["لاعبو", "مشجعوه", "انتشروا"],
      maxPoints: 3,
    },
    {
      id: "g2",
      type: "freeText",
      prompt: "أعد كتابة ما يلي بصيغة المفرد:",
      context:
        "دخل اللاعبون بقاماتهم الرّشيقة الّتي تخطف الأنظار، ثابتي الخطى، مرتدين الثّياب الملوّنة، فاستقبلناهم بالهتافات الصّاخبة.",
      expected:
        "دخل اللاعب بقامته الرّشيقة التي تخطف الأنظار، ثابت الخطى، مرتديا الثياب الملونة، فاستقبلته بالهتاف الصاخب.",
      maxPoints: 6,
    },
    {
      id: "g3",
      type: "tableFill",
      prompt: "املأ الفراغ بما يناسب، وحَرِّك آخِر الفِعْل، اكتب الكلمة التي تصححها فقط من دون غيرها:",
      tableColumns: ["الماضي", "المضارع المرفوع", "المضارع المجزوم", "الأمر"],
      tableRows: [
        {
          id: "r1",
          label: "الجذر",
          cells: [
            { col: "الماضي", expected: "حمى", given: "حمى" },
            { col: "المضارع المرفوع", expected: "يحمي" },
            { col: "المضارع المجزوم", expected: "لم يحمِ" },
            { col: "الأمر", expected: "احمِ" },
          ],
        },
      ],
    },
    {
      id: "g4",
      type: "tokenCorrection",
      prompt: "صرّف الفعل (التَقَطَ) مع الضّمائر المذكورة أدناه، وحَرِّك آخِر الفِعْل:",
      tokens: [
        { id: "ana", label: "أنا", expected: "أنا التقطتُ" },
        { id: "nahnu", label: "نحن", expected: "نحن التقطنا" },
        { id: "huwa", label: "هو", expected: "هو التقطَ" },
        { id: "antuma", label: "أنتما", expected: "أنتما التقطتما" },
        { id: "hunna", label: "هنّ", expected: "هنّ التقطنَ" },
      ],
    },
    {
      id: "g5",
      type: "correctedWords",
      prompt: "صحّح الأخطاء الواردة في المقطع الآتي. اكتب الكلمات المصحَّحة فقط من دون غيرها (افصل بينها بمسافة أو فاصلة):",
      context:
        "عاد اللاعبين من المباراة فرحين، فهنّأهم المسؤولين، ثم راحوا يُقَدِّموا لهم الجوائز القيّمة. أمّا لاعبوا الفريق الآخر فقد عادوا مخذولون، ولم يحظون سوى بالخيبة.",
      expectedWords: [
        "اللاعبون",
        "المسؤولون",
        "يقدمون",
        "لاعبو",
        "مخذولين",
        "يحظوا",
      ],
      maxPoints: 6,
    },
    {
      id: "g6",
      type: "finalHarakaTokens",
      prompt:
        "اضبط الحرف الأخير فقط من كلّ كلمة من الكلمات الآتية (لا داعي لضبط الحروف الدّاخليّة):",
      context:
        "وهكذا، بعد أن سكنت حركة الكرة، التقط قائد فريقنا كأس البطولة الباردة بقبضته الحارة، ثم قبلها، ورفعها فوق رأسه...",
      tokens: [
        { id: "t1", label: "سكنت", expected: "سكنَت" },
        { id: "t2", label: "حركة", expected: "حركةُ" },
        { id: "t3", label: "الكرة", expected: "الكرةِ" },
        { id: "t4", label: "التقط", expected: "التقطَ" },
        { id: "t5", label: "قائد", expected: "قائدُ" },
        { id: "t6", label: "فريقنا", expected: "فريقِنا" },
        { id: "t7", label: "كأس", expected: "كأسَ" },
        { id: "t8", label: "البطولة", expected: "البطولةِ" },
        { id: "t9", label: "الباردة", expected: "الباردةَ" },
        { id: "t10", label: "بقبضته", expected: "بقبضتِهِ" },
        { id: "t11", label: "الحارة", expected: "الحارةِ" },
        { id: "t12", label: "قبلها", expected: "قبلَها" },
        { id: "t13", label: "رفعها", expected: "رفعَها" },
        { id: "t14", label: "فوق", expected: "فوقَ" },
        { id: "t15", label: "رأسه", expected: "رأسِهِ" },
      ],
    },
    {
      id: "g7",
      type: "subgroup",
      prompt: "دلّ على الإجابة الصّحيحة:",
      subs: [
        {
          id: "7A",
          prompt: "تتالى تحقيق الأهداف:",
          options: [
            { id: "a", label: "جملة اسميّة" },
            { id: "b", label: "جملة فعليّة", correct: true },
          ],
        },
        {
          id: "7B",
          prompt: "قلوبهم تخفق:",
          options: [
            { id: "a", label: "جملة اسميّة", correct: true },
            { id: "b", label: "جملة فعليّة" },
          ],
        },
        {
          id: "7C",
          prompt: "اشرأبّت الأعناق:",
          options: [
            { id: "a", label: "جملة اسميّة" },
            { id: "b", label: "جملة فعليّة", correct: true },
          ],
        },
        {
          id: "7D",
          prompt: "أعصابهم مضطربة:",
          options: [
            { id: "a", label: "جملة اسميّة", correct: true },
            { id: "b", label: "جملة فعليّة" },
          ],
        },
      ],
    },
    {
      id: "g8",
      type: "subgroup",
      prompt: "اختر الإعراب الصّحيح للكلمات الآتية:",
      subs: [
        {
          id: "8A",
          prompt:
            "(المشجّعين) — حتّى فوجئت بمدارج الملعب تغصّ بآلاف المشجّعين.",
          options: [
            { id: "a", label: "حال منصوبة، علامة النّصب الفتحة" },
            { id: "b", label: "حال منصوبة، علامة النّصب الياء لأنّها مثنّى" },
            {
              id: "c",
              label:
                "مضاف إليه مجرور، وعلامة جرّه الياء لأنّه جمع مذكّر سالم",
              correct: true,
            },
          ],
        },
        {
          id: "8B",
          prompt: "(تتالى) — تتالى تحقيق الأهداف بين الفريقين.",
          options: [
            { id: "a", label: "فعل ماضٍ مبنيّ على الفتحة الظّاهرة على آخره" },
            {
              id: "b",
              label: "فعل ماضٍ مبنيّ على الفتحة المقدّرة على الألف للتّعذّر",
              correct: true,
            },
            {
              id: "c",
              label: "فعل ماضٍ مبنيّ على الفتحة المقدّرة على الألف للثّقل",
            },
          ],
        },
        {
          id: "8C",
          prompt: "(صرخات) — وأطلقت الحناجر صرخات قويّة مزّقت أرجاء الملعب.",
          options: [
            {
              id: "a",
              label:
                "مضاف إليه مجرور وعلامة جرّه الكسرة الظّاهرة، والثّانية للتّنوين",
            },
            {
              id: "b",
              label:
                "مفعول به مجرور وعلامة جرّه الكسرة الظّاهرة، والثّانية للتّنوين",
            },
            {
              id: "c",
              label:
                "مفعول به منصوب وعلامة نصبه الكسرة عوضًا عن الفتحة، لأنّه جمع مؤنّث سالم، والثّانية للتّنوين",
              correct: true,
            },
          ],
        },
      ],
    },
    {
      id: "g9",
      type: "single",
      prompt:
        "حدّد المحلّ الإعرابيّ الصّحيح للجملة: «وقاماتهم الرّشيقة تخطف الأنظار» (السّياق: بعد قليل دخل لاعبو فريقنا الملعب بأقدامهم الثّابتة، وقاماتهم الرّشيقة تخطف الأنظار).",
      options: [
        { id: "a", label: "جملة اسميّة في محلّ رفع خبر للمبتدأ" },
        { id: "b", label: "جملة اسميّة في محلّ نصب حال", correct: true },
        { id: "c", label: "جملة اسميّة في محلّ جرّ بحرف الجرّ" },
      ],
    },
    {
      id: "g10",
      type: "subgroup",
      prompt: "علّل كتابة الهمزة في الكلمات الآتية:",
      subs: [
        {
          id: "10A",
          prompt: "بَدْءَ:",
          options: [
            { id: "a", label: "متطرّفة وما قبلها ساكن", correct: true },
            { id: "b", label: "متطرّفة مفتوحة" },
            { id: "c", label: "متطرّفة مفتوحة وما قبلها ساكن" },
          ],
        },
        {
          id: "10B",
          prompt: "قائد:",
          options: [
            { id: "a", label: "متوسّطة وما قبلها ألف ممدودة" },
            { id: "b", label: "متوسّطة مسبوقة بحرف ساكن" },
            {
              id: "c",
              label: "متوسّطة مكسورة وما قبلها حرف مدّ ساكن",
              correct: true,
            },
          ],
        },
      ],
    },
    {
      id: "g11",
      type: "correctedWords",
      prompt: "صحّح الأخطاء الإملائيّة الواردة في المقطع الآتي. اكتب في الإجابة الكلمات المصحَّحة فقط من دون غيرها (افصل بينها بمسافة أو فاصلة):",
      context:
        "إنّ صديقي فتى مأمن يؤدي الواجباة الدينية بدقة وانتظامن. غير أنه بطيئ في تأدية واجباته المدرسية، وكل درس، بالنسبة إليه، عِبئ ثقيل. أتمنى له اتوفيق في شؤنه اليومية.",
      expectedWords: [
        "فتى",
        "مؤمن",
        "يؤدي",
        "الواجبات",
        "الدينية",
        "بدقة",
        "وانتظام",
        "أنه",
        "بطيء",
        "تأدية",
        "واجباته",
        "المدرسية",
        "درس",
        "عبء",
        "أتمنى",
        "التوفيق",
        "شؤونه",
        "اليومية",
      ],
      maxPoints: 18,
    },
  ],
};

// =====================================================================
// SECTION 3 — في التعبير (ungraded)
// =====================================================================
const section3: Section = {
  id: "expression",
  title: "في التَّعبيرِ",
  graded: false,
  questions: [
    {
      id: "e1",
      type: "longText",
      prompt:
        "شاهدتَ مباراة في كرة القدم. اسرد ما جرى، واصفًا الملعب، والمشجّعين، واللاعبين، والحكم، والكرة... مبيّنًا شعورك.",
    },
  ],
};

// =====================================================================
// SECTION 4 — في البحث (ungraded)
// =====================================================================
const section4: Section = {
  id: "research",
  title: "في البَحثِ",
  graded: false,
  questions: [
    {
      id: "r1",
      type: "longText",
      prompt:
        "أعدَّ بحثًا، مدعومًا بالصّور المناسبة، تبيّن فيه قانون لعبة كرة السّلّة، مركّزًا على: مساحة الملعب المطلوبة – عدد اللاعبين – عدد الأخطاء المسموح بها للاعب – صلاحيّة الحكم – شروط التّأهّل للمباراة النّهائيّة، وغيرها...",
    },
  ],
};

export const sections: Section[] = [section1, section2, section3, section4];

// =====================================================================
// GRADING
// =====================================================================
export interface QuestionScore {
  questionId: string;
  earned: number;
  max: number;
  detail?: Record<string, { ok: boolean; given?: string; expected?: string }>;
}

const normalize = (s: string) =>
  (s || "")
    .replace(/[\u064B-\u0652\u0670]/g, "") // strip diacritics for loose match
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/\s+/g, " ")
    .replace(/[.,،؟!?…]/g, "")
    .trim()
    .toLowerCase();

const exactWithDiacritics = (s: string) =>
  (s || "").replace(/\s+/g, " ").trim();

export function gradeSingle(q: Question, given: string | undefined): QuestionScore {
  const correct = q.options?.find((o) => o.correct)?.id;
  const ok = !!given && given === correct;
  return { questionId: q.id, earned: ok ? 1 : 0, max: 1 };
}

export function gradeMulti(q: Question, given: string[] = []): QuestionScore {
  const correctIds = q.options!.filter((o) => o.correct).map((o) => o.id);
  const max = correctIds.length;
  let earned = 0;
  for (const id of given) {
    if (correctIds.includes(id)) earned += 1;
    else earned -= 0.5;
  }
  earned = Math.max(0, Math.min(max, earned));
  return { questionId: q.id, earned, max };
}

export function gradeSubgroup(q: Question, given: Record<string, string | string[]> = {}): QuestionScore {
  let earned = 0;
  let max = 0;
  const detail: QuestionScore["detail"] = {};
  for (const sub of q.subs!) {
    if (sub.type === "multi") {
      const correctIds = sub.options.filter((o) => o.correct).map((o) => o.id);
      const subMax = correctIds.length;
      max += subMax;
      const arr = (given[sub.id] as string[]) || [];
      let s = 0;
      for (const id of arr) {
        if (correctIds.includes(id)) s += 1;
        else s -= 0.5;
      }
      s = Math.max(0, Math.min(subMax, s));
      earned += s;
      detail[sub.id] = { ok: s === subMax, given: arr.join(","), expected: correctIds.join(",") };
    } else {
      max += 1;
      const correctId = sub.options.find((o) => o.correct)?.id;
      const g = given[sub.id] as string | undefined;
      const ok = !!g && g === correctId;
      if (ok) earned += 1;
      detail[sub.id] = { ok, given: g, expected: correctId };
    }
  }
  return { questionId: q.id, earned, max, detail };
}

export function gradeTokenCorrection(
  q: Question,
  given: Record<string, string> = {}
): QuestionScore {
  const detail: QuestionScore["detail"] = {};
  let earned = 0;
  const max = q.tokens!.length;
  for (const tok of q.tokens!) {
    const g = given[tok.id] || "";
    // For tashkeel: try exact-with-diacritics first, then loose
    const exactOk = exactWithDiacritics(g) === exactWithDiacritics(tok.expected);
    if (exactOk) {
      earned += 1;
      detail[tok.id] = { ok: true, given: g, expected: tok.expected };
    } else {
      // Half credit if base matches but diacritics differ
      if (normalize(g) === normalize(tok.expected) && g.length > 0) {
        earned += 0.5;
        detail[tok.id] = { ok: false, given: g, expected: tok.expected };
      } else {
        detail[tok.id] = { ok: false, given: g, expected: tok.expected };
      }
    }
  }
  return { questionId: q.id, earned, max, detail };
}

export function gradeTableFill(
  q: Question,
  given: Record<string, Record<string, string>> = {}
): QuestionScore {
  const detail: QuestionScore["detail"] = {};
  let earned = 0;
  let max = 0;
  for (const row of q.tableRows!) {
    for (const cell of row.cells) {
      // pre-filled cells (with given) skip grading
      if (cell.given) continue;
      max += 1;
      const g = given[row.id]?.[cell.col] || "";
      const ok = exactWithDiacritics(g) === exactWithDiacritics(cell.expected);
      const half = !ok && normalize(g) === normalize(cell.expected) && g.length > 0;
      if (ok) earned += 1;
      else if (half) earned += 0.5;
      detail[`${row.id}:${cell.col}`] = { ok, given: g, expected: cell.expected };
    }
  }
  return { questionId: q.id, earned, max };
}

export function gradeFreeText(q: Question, given: string | undefined): QuestionScore {
  const max = q.maxPoints ?? 5;
  if (!given || !given.trim()) return { questionId: q.id, earned: 0, max };
  const expectedTokens = (q.expected || "").split(/\s+/).map(normalize).filter(Boolean);
  const givenTokens = new Set(given.split(/\s+/).map(normalize).filter(Boolean));
  if (expectedTokens.length === 0) return { questionId: q.id, earned: 0, max };
  let matched = 0;
  for (const t of expectedTokens) if (givenTokens.has(t)) matched += 1;
  const ratio = matched / expectedTokens.length;
  return { questionId: q.id, earned: Math.round(ratio * max * 10) / 10, max };
}

import { gradeCorrectedWords, endingsMatch } from "@/lib/correctedWords";

export function gradeCorrectedWordsQ(q: Question, given: string | undefined): QuestionScore {
  const expected = q.expectedWords || [];
  const r = gradeCorrectedWords(expected, given);
  return { questionId: q.id, earned: r.earned, max: r.max };
}

export function gradeFinalHarakaTokens(
  q: Question,
  given: Record<string, string> = {}
): QuestionScore {
  const tokens = q.tokens || [];
  const detail: QuestionScore["detail"] = {};
  let earned = 0;
  for (const t of tokens) {
    const g = (given[t.id] || "").trim();
    const ok = !!g && endingsMatch(g, t.expected);
    if (ok) earned += 1;
    detail[t.id] = { ok, given: g, expected: t.expected };
  }
  return { questionId: q.id, earned, max: tokens.length, detail };
}

export function gradeQuestion(q: Question, given: AnswerValue): QuestionScore {
  switch (q.type) {
    case "single":
      return gradeSingle(q, given as string);
    case "multi":
      return gradeMulti(q, (given as string[]) || []);
    case "subgroup":
      return gradeSubgroup(q, (given as any) || {});
    case "tokenCorrection":
      return gradeTokenCorrection(q, (given as any) || {});
    case "tableFill":
      return gradeTableFill(q, (given as any) || {});
    case "freeText":
      return gradeFreeText(q, given as string);
    case "correctedWords":
      return gradeCorrectedWordsQ(q, given as string);
    case "finalHarakaTokens":
      return gradeFinalHarakaTokens(q, (given as any) || {});
    default:
      return { questionId: q.id, earned: 0, max: 0 };
  }
}

export function gradeSection(
  section: Section,
  answers: Record<string, AnswerValue>
): { earned: number; max: number; perQuestion: QuestionScore[] } {
  const perQuestion = section.questions.map((q) => gradeQuestion(q, answers[q.id]));
  const earned = perQuestion.reduce((a, b) => a + b.earned, 0);
  const max = perQuestion.reduce((a, b) => a + b.max, 0);
  return { earned, max, perQuestion };
}
