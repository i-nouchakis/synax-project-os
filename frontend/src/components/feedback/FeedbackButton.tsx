import { useState, useRef } from 'react';
import { MessageSquarePlus, Bug, Lightbulb, Send, X, Camera } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas-pro';
import { feedbackService, type FeedbackType } from '@/services/feedback.service';

type Step = 'closed' | 'capturing' | 'select_type' | 'description';

export function FeedbackButton() {
  const [step, setStep] = useState<Step>('closed');
  const [type, setType] = useState<FeedbackType | null>(null);
  const [description, setDescription] = useState('');
  const [screenshotBlob, setScreenshotBlob] = useState<Blob | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const reset = () => {
    setStep('closed');
    setType(null);
    setDescription('');
    if (screenshotUrl) URL.revokeObjectURL(screenshotUrl);
    setScreenshotBlob(null);
    setScreenshotUrl(null);
  };

  const captureScreenshot = async () => {
    setStep('capturing');
    try {
      await new Promise((r) => setTimeout(r, 100));
      const canvas = await html2canvas(document.body, {
        scale: 1,
        useCORS: true,
        ignoreElements: (el) => el.id === 'feedback-widget',
      });
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png')
      );
      if (blob && blob.size > 0) {
        setScreenshotBlob(blob);
        setScreenshotUrl(URL.createObjectURL(blob));
      }
    } catch (err) {
      console.error('Screenshot capture failed:', err);
    }
    setStep('select_type');
  };

  const handleTypeSelect = (t: FeedbackType) => {
    setType(t);
    setStep('description');
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleSubmit = async () => {
    if (!type || !description.trim()) return;
    setIsSubmitting(true);
    try {
      await feedbackService.create({
        type,
        description: description.trim(),
        pageUrl: window.location.pathname,
        screenshot: screenshotBlob || undefined,
      });
      toast.success(type === 'BUG' ? 'Bug reported!' : 'Suggestion sent!');
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'closed' || step === 'capturing') {
    return (
      <div id="feedback-widget" className="fixed bottom-6 right-6 z-50">
        <button
          onClick={captureScreenshot}
          disabled={step === 'capturing'}
          className="w-12 h-12 rounded-full bg-primary text-white shadow-lg hover:bg-primary-dark transition-all hover:scale-105 flex items-center justify-center disabled:opacity-70"
          title="Send Feedback"
        >
          {step === 'capturing' ? (
            <Camera size={20} className="animate-pulse" />
          ) : (
            <MessageSquarePlus size={20} />
          )}
        </button>
      </div>
    );
  }

  return (
    <div id="feedback-widget" className="fixed bottom-6 right-6 z-50">
      <div className="w-80 bg-surface border border-surface-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-primary/10 border-b border-surface-border">
          <span className="text-body-sm font-semibold text-text-primary">
            {step === 'select_type' ? 'What would you like to report?' : type === 'BUG' ? 'Report a Bug' : 'Suggest a Change'}
          </span>
          <button onClick={reset} className="p-1 rounded hover:bg-surface-hover text-text-tertiary">
            <X size={16} />
          </button>
        </div>

        {/* Screenshot preview */}
        {screenshotUrl && (
          <div className="px-4 pt-3">
            <div className="relative rounded-lg overflow-hidden border border-surface-border">
              <img src={screenshotUrl} alt="Screenshot" className="w-full h-28 object-cover object-top" />
              <div className="absolute top-1 right-1">
                <span className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">Screenshot captured</span>
              </div>
            </div>
          </div>
        )}

        {/* Step: Select type */}
        {step === 'select_type' && (
          <div className="p-4 space-y-2">
            <button
              onClick={() => handleTypeSelect('BUG')}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-surface-border hover:border-error/50 hover:bg-error/5 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
                <Bug size={20} className="text-error" />
              </div>
              <div>
                <p className="text-body-sm font-medium text-text-primary">Bug</p>
                <p className="text-caption text-text-tertiary">Something is broken or not working</p>
              </div>
            </button>
            <button
              onClick={() => handleTypeSelect('CHANGE')}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-surface-border hover:border-warning/50 hover:bg-warning/5 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Lightbulb size={20} className="text-warning" />
              </div>
              <div>
                <p className="text-body-sm font-medium text-text-primary">Change</p>
                <p className="text-caption text-text-tertiary">Suggest an improvement or new feature</p>
              </div>
            </button>
          </div>
        )}

        {/* Step: Description */}
        {step === 'description' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              {type === 'BUG' ? (
                <Bug size={16} className="text-error" />
              ) : (
                <Lightbulb size={16} className="text-warning" />
              )}
              <button
                onClick={() => setStep('select_type')}
                className="text-caption text-primary hover:underline"
              >
                Change type
              </button>
            </div>
            <textarea
              ref={textareaRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === 'BUG' ? 'Describe the bug...' : 'Describe your suggestion...'}
              rows={4}
              className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            />
            <button
              onClick={handleSubmit}
              disabled={!description.trim() || isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white font-medium text-body-sm hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={16} />
                  Send
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
