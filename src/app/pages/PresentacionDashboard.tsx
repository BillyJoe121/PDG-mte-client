import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Sparkles } from "lucide-react";

export function PresentacionDashboard() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6" style={{ backgroundColor: "#F8FAFC", fontFamily: "Montserrat, sans-serif" }}>
      <motion.div
        className="flex h-20 w-20 items-center justify-center rounded-2xl"
        style={{ backgroundColor: "#5454E914", border: "1px solid #5454E930" }}
        initial={{ opacity: 0, scale: 0.5, rotate: -15 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 5, 0], scale: [1, 1.15, 1, 1.08, 1] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
        >
          <Sparkles size={36} color="#5454E9" />
        </motion.div>
      </motion.div>

      <div className="text-center">
        <motion.h1
          style={{ fontSize: 32, fontWeight: 950, color: "#5454E9", lineHeight: 1.1 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2, ease: "easeOut" }}
        >
          Próximamente
        </motion.h1>
        <motion.p
          style={{ fontSize: 14, fontWeight: 600, color: "#717182", marginTop: 12 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.4, ease: "easeOut" }}
        >
          El modo presentación estará disponible en una próxima actualización.
        </motion.p>
      </div>

      <motion.button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 rounded-lg px-5 py-2.5"
        style={{ backgroundColor: "#5454E9", color: "#fff", fontSize: 13, fontWeight: 850, boxShadow: "0 10px 28px #5454E933" }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.6, ease: "easeOut" }}
        whileHover={{ scale: 1.05, boxShadow: "0 14px 36px #5454E955" }}
        whileTap={{ scale: 0.97 }}
      >
        <ArrowLeft size={15} />
        Volver al Dashboard
      </motion.button>
    </div>
  );
}
