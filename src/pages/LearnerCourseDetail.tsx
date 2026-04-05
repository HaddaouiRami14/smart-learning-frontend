import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import {
  BookOpen, Clock, ChevronLeft, Lock, CheckCircle,
  Zap, Star, Users, ShieldCheck, CreditCard, Loader2, AlertCircle
} from "lucide-react";

// ─── Stripe ────────────────────────────────────────────────────────────────────
const stripePromise = loadStripe("pk_test_51TFjd7DGtu44UVBJ41br5w0dQh7jEFlc8h57uMnM12TZTTuFHOklUA0ibkO4FGs3opE0AHXIsNhYdHTBuVlqruIF00oM9ojyJX");

// ─── Constants ─────────────────────────────────────────────────────────────────
const API_BASE       = "http://localhost:8080/api/learner/courses";
const ENROLLMENT_API = "http://localhost:8080/api/learner/enrollments";
const PAYMENT_API    = "http://localhost:8080/api/payment";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Chapter { id: number; title: string; orderIndex: number; }
interface Course {
  id: number; title: string; description: string;
  category: string; price: number; level: string;
  imageUrl: string; isActive: boolean; chapters: Chapter[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const getUserId = (): number | null => {
  try { const s = localStorage.getItem("user"); return s ? JSON.parse(s).id ?? null : null; }
  catch { return null; }
};
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});
const levelConfig: Record<string, { label: string; color: string }> = {
  BEGINNER:     { label: "Beginner",     color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
  INTERMEDIATE: { label: "Intermediate", color: "bg-amber-500/20  text-amber-300  border-amber-500/40"  },
  ADVANCED:     { label: "Advanced",     color: "bg-rose-500/20   text-rose-300   border-rose-500/40"   },
};

// ─── CheckoutForm — must live INSIDE <Elements> ────────────────────────────────
const CheckoutForm = ({ course, onSuccess }: { course: Course; onSuccess: () => void }) => {
  const stripe   = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error,   setError  ] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const card = elements.getElement(CardElement);
    if (!card) { setLoading(false); return; }

    // clientSecret is already inside the Elements context — confirmCardPayment picks it up
    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (elements as any)._elements[0]?._frame?._stripeContext?.clientSecret ?? "",
      { payment_method: { card } }
    );

    // ↑ fallback approach: pass clientSecret via prop instead
    if (stripeError) {
      setError(stripeError.message || "Payment failed.");
      setLoading(false);
      return;
    }
    if (paymentIntent?.status === "succeeded") {
      const userId = getUserId();
      if (userId) {
        try {
          await axios.post(`${ENROLLMENT_API}/${userId}/enroll/${course.id}`, {}, { headers: getAuthHeaders() });
        } catch { /* proceed anyway */ }
      }
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
          Card Details
        </label>
        {/* Plain div — no blur, no opacity, no transform */}
        <div style={{
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: "10px",
          padding: "14px 16px",
        }}>
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#f1f5f9",
                  fontFamily: "monospace",
                  "::placeholder": { color: "#64748b" },
                  iconColor: "#818cf8",
                },
                invalid: { color: "#f87171", iconColor: "#f87171" },
              },
              hidePostalCode: true,
            }}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <p className="text-xs text-slate-500 text-center">
        Test: <span className="font-mono text-slate-400">4242 4242 4242 4242</span> · any future date · any CVC
      </p>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-4 text-base font-bold text-white transition-all hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading
          ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
          : <><CreditCard className="w-5 h-5" /> Pay ${course.price.toFixed(2)} & Enroll</>}
      </button>
    </form>
  );
};

// ─── Wrapper that owns clientSecret and passes it to <Elements> ────────────────
const StripeWrapper = ({ course, onSuccess }: { course: Course; onSuccess: () => void }) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [initError,    setInitError   ] = useState<string | null>(null);

  useEffect(() => {
    axios.post(
      `${PAYMENT_API}/create-payment-intent`,
      { amount: Math.round(course.price * 100) },
      { headers: getAuthHeaders() }
    )
      .then(res => setClientSecret(res.data.clientSecret))
      .catch(() => setInitError("Could not initialize payment. Please refresh."));
  }, [course.price]);

  if (initError) return (
    <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
      <AlertCircle className="w-4 h-4" /> {initError}
    </div>
  );

  if (!clientSecret) return (
    <div className="flex items-center justify-center py-8 gap-3 text-slate-400">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-sm">Initializing payment...</span>
    </div>
  );

  return (
    // ✅ clientSecret passed here — this is what makes CardElement work
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutFormWithSecret course={course} onSuccess={onSuccess} clientSecret={clientSecret} />
    </Elements>
  );
};

// ─── CheckoutForm with explicit clientSecret prop ──────────────────────────────
const CheckoutFormWithSecret = ({
  course, onSuccess, clientSecret
}: { course: Course; onSuccess: () => void; clientSecret: string }) => {
  const stripe   = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error,   setError  ] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const card = elements.getElement(CardElement);
    if (!card) { setLoading(false); return; }

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card },
    });

    if (stripeError) {
      setError(stripeError.message || "Payment failed.");
      setLoading(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      const userId = getUserId();
      if (userId) {
        try {
          await axios.post(`${ENROLLMENT_API}/${userId}/enroll/${course.id}`, {}, { headers: getAuthHeaders() });
        } catch { /* proceed */ }
      }
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
          Card Details
        </label>
        <div style={{
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: "10px",
          padding: "14px 16px",
        }}>
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#f1f5f9",
                  fontFamily: "monospace",
                  "::placeholder": { color: "#64748b" },
                  iconColor: "#818cf8",
                },
                invalid: { color: "#f87171", iconColor: "#f87171" },
              },
              hidePostalCode: true,
            }}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <p className="text-xs text-slate-500 text-center">
        Test: <span className="font-mono text-slate-400">4242 4242 4242 4242</span> · any future date · any CVC
      </p>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-4 text-base font-bold text-white transition-all hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading
          ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
          : <><CreditCard className="w-5 h-5" /> Pay ${course.price.toFixed(2)} & Enroll</>}
      </button>
    </form>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
const LearnerCourseDetail = () => {
  const { courseId } = useParams();
  const navigate     = useNavigate();

  const [course,    setCourse   ] = useState<Course | null>(null);
  const [chapters,  setChapters ] = useState<Chapter[]>([]);
  const [loading,   setLoading  ] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error,     setError    ] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [cRes, chRes] = await Promise.all([
          axios.get(`${API_BASE}/${courseId}`,          { headers: getAuthHeaders() }),
          axios.get(`${API_BASE}/${courseId}/chapters`, { headers: getAuthHeaders() }),
        ]);
        setCourse(cRes.data);
        setChapters(chRes.data.sort((a: Chapter, b: Chapter) => a.orderIndex - b.orderIndex));
      } catch {
        setError("Failed to load course.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId]);

  const handleFreeEnroll = async () => {
    const userId = getUserId();
    if (!userId || !courseId) return;
    setEnrolling(true);
    try {
      await axios.post(`${ENROLLMENT_API}/${userId}/enroll/${courseId}`, {}, { headers: getAuthHeaders() });
      navigate(`/courses/${courseId}/learnerpreview`);
    } catch {
      setError("Failed to enroll. Please try again.");
    } finally {
      setEnrolling(false);
    }
  };

  // ─── Guards ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
        <p className="text-slate-400 text-sm">Loading course...</p>
      </div>
    </div>
  );

  if (!course) return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center flex-col gap-4">
      <AlertCircle className="w-16 h-16 text-red-400" />
      <p className="text-slate-300">{error || "Course not found."}</p>
      <button onClick={() => navigate("/courses")} className="text-indigo-400 hover:text-indigo-300 underline">
        Back to Courses
      </button>
    </div>
  );

  const levelInfo = course.level ? levelConfig[course.level] : null;
  const isFree    = course.price === 0;

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Background blobs — isolated, never interfere with clicks */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-violet-600/8 blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-64 h-64 rounded-full bg-indigo-500/6 blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-white/5 bg-[#0d1424]">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate("/courses")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Courses
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="relative z-10">
        <div className="relative h-72 overflow-hidden">
          {course.imageUrl
            ? <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover opacity-30" />
            : <div className="w-full h-full bg-gradient-to-br from-indigo-900/40 to-violet-900/40" />}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0f1e]/60 to-[#0a0f1e]" />
        </div>

        <div className="max-w-6xl mx-auto px-6 -mt-24 relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-3 py-1 rounded-full bg-white/10 text-white/70 text-xs font-semibold border border-white/10">
              {course.category}
            </span>
            {levelInfo && (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${levelInfo.color}`}>
                {levelInfo.label}
              </span>
            )}
            {isFree && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                Free Course
              </span>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight max-w-3xl">
            {course.title}
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-2xl mb-6">{course.description}</p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400 mb-10">
            <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-indigo-400" />{chapters.length} chapter{chapters.length !== 1 ? "s" : ""}</span>
            <span className="flex items-center gap-1.5"><Clock   className="w-4 h-4 text-violet-400" />Self-paced</span>
            <span className="flex items-center gap-1.5"><Users   className="w-4 h-4 text-sky-400"    />Open enrollment</span>
            <span className="flex items-center gap-1.5"><Star    className="w-4 h-4 text-yellow-400 fill-yellow-400" />Certificate on completion</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pb-20 grid lg:grid-cols-3 gap-8">

        {/* Left */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" /> Course Curriculum
          </h2>

          <div className="rounded-2xl border border-white/8 bg-[#111827] overflow-hidden divide-y divide-white/5">
            {chapters.map((ch, i) => (
              <div key={ch.id} className="flex items-center gap-4 px-5 py-4 group">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:border-indigo-500/40 group-hover:text-indigo-400 transition-all">
                  {i + 1}
                </div>
                <p className="flex-1 text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{ch.title}</p>
                <Lock className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-white/8 bg-[#111827] p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" /> What you'll get
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {["Full lifetime access","Quizzes & exercises","Downloadable resources","Progress tracking"].map(item => (
                <div key={item} className="flex items-center gap-2 text-sm text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" /> {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — payment card */}
        <div className="lg:col-span-1">
          {/* ✅ Solid bg, no blur, no opacity tricks, no transform */}
          <div className="sticky top-6 rounded-2xl border border-slate-700 p-6 shadow-2xl"
            style={{ background: "#111827" }}>

            <div className="text-center mb-6">
              {isFree
                ? <p className="text-5xl font-extrabold text-emerald-400">Free</p>
                : <>
                    <p className="text-5xl font-extrabold text-white">${course.price.toFixed(2)}</p>
                    <p className="text-slate-500 text-sm mt-1">One-time payment · USD</p>
                  </>}
            </div>

            <div className="h-px bg-slate-700 mb-6" />

            {isFree ? (
              <button
                onClick={handleFreeEnroll}
                disabled={enrolling}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-4 text-base font-bold text-white transition-all hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50"
              >
                {enrolling
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Enrolling...</>
                  : <><CheckCircle className="w-5 h-5" /> Enroll for Free</>}
              </button>
            ) : (
              /* StripeWrapper fetches clientSecret then renders Elements + CardElement */
              <StripeWrapper
                course={course}
                onSuccess={() => navigate(`/courses/${courseId}/learnerpreview`)}
              />
            )}

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            <div className="mt-6 space-y-2">
              {[
                { icon: ShieldCheck, text: "Secure payment by Stripe" },
                { icon: CheckCircle, text: "Instant access after payment" },
                { icon: BookOpen,    text: "Learn at your own pace" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-xs text-slate-500">
                  <Icon className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" /> {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnerCourseDetail;