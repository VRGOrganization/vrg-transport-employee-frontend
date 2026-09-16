"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Course, CourseModel } from "@/types/university.types";
import { COURSE_MODEL_OPTIONS } from "@/types/university.types";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { FieldShell } from "@/components/ui/FieldShell";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { fieldStaggerVariants } from "@/lib/motion";
import { BookOpen, Check } from "lucide-react";

interface Props {
  open: boolean;
  initial?: Course | null;
  universityName: string;
  onClose: () => void;
  onSubmit: (data: { name: string; model: CourseModel | null }) => Promise<void>;
}

const MODEL_OPTIONS = COURSE_MODEL_OPTIONS.map((m) => ({ value: m, label: m }));

export function CourseFormModal({ open, initial, universityName, onClose, onSubmit }: Props) {
  const shouldReduceMotion = useReducedMotion();
  const [name, setName] = useState("");
  const [model, setModel] = useState<CourseModel | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setModel(initial?.model ?? "");
      setError("");
    }
  }, [open, initial]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("O Nome Do Curso É Obrigatório.");
      return;
    }
    if (!model) {
      setError("O Modelo Do Curso É Obrigatório.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSubmit({ name: name.trim(), model: model || null });
      onClose();
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Erro Ao Salvar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={initial ? "Editar Curso" : "Novo Curso"}
      footer={
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            fullWidth
            icon={<Check className="size-4" />}
            onClick={handleSubmit}
            loading={loading}
          >
            {initial ? "Salvar" : "Cadastrar"}
          </Button>
        </div>
      }
    >
      <p className="text-xs text-on-surface-variant -mt-1 mb-4">{universityName}</p>

      <div className="space-y-4">
        <motion.div custom={0} initial={shouldReduceMotion ? undefined : "hidden"} animate="visible" variants={fieldStaggerVariants}>
          <Input
            label="Nome Do Curso"
            icon={<BookOpen className="size-4" />}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Psicologia"
          />
        </motion.div>

        <motion.div custom={1} initial={shouldReduceMotion ? undefined : "hidden"} animate="visible" variants={fieldStaggerVariants}>
          <FieldShell label="Modelo">
            <SegmentedControl options={MODEL_OPTIONS} value={model} onChange={(v) => setModel(v as CourseModel | "")} columns={3} />
          </FieldShell>
        </motion.div>
      </div>

      {error && <StatusBanner variant="error" className="mt-4">{error}</StatusBanner>}
    </Modal>
  );
}
