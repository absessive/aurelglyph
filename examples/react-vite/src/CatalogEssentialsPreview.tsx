import { useEffect, useRef, useState } from "react";
import { Accordion, Button, Chip, InputGroup, Link, PasswordField, Rating, Stack, Stepper, ValidationSummary } from "@aurelglyph/react";

/** Executable specimens, not explanatory UI copy. */
export function CatalogEssentialsPreview() {
  const [chipVisible, setChipVisible] = useState(true);
  const chipGroup = useRef<HTMLDivElement>(null);
  const focusRestoredChip = useRef(false);
  const [password, setPassword] = useState("");
  const [amount, setAmount] = useState("");
  const [submission, setSubmission] = useState(0);
  const [currentStep, setCurrentStep] = useState("review");
  useEffect(() => {
    if (chipVisible && focusRestoredChip.current) { focusRestoredChip.current = false; chipGroup.current?.querySelector<HTMLButtonElement>(".ag-chip__select")?.focus(); }
  }, [chipVisible]);
  const passwordError = submission > 0 && password.length < 12 ? "Use at least 12 characters." : undefined;
  const amountError = submission > 0 && (!amount.trim() || !Number.isFinite(Number(amount)) || Number(amount) <= 0) ? "Enter a positive amount." : undefined;
  const errors = [
    ...(passwordError ? [{ id: "password", fieldId: "catalog-password", message: passwordError }] : []),
    ...(amountError ? [{ id: "amount", fieldId: "catalog-amount", message: amountError }] : [])
  ];
  return <section className="example-preview-card" data-catalog-essentials>
    <h2>Catalog essentials</h2>
    <Stack gap="md">
      <div className="example-inline-row"><Link external href="https://aurelglyph.absessive.com/usage.html">View guide</Link><Link disabled href="/unavailable">Unavailable</Link></div>
      <form aria-label="Workspace filters" onSubmit={(event) => event.preventDefault()}><div className="example-inline-row" ref={chipGroup}>{chipVisible ? <Chip defaultSelected label="Workbench" name="catalog-scope" onRemove={() => setChipVisible(false)} removeLabel="Remove Workbench" value="workbench" /> : <Button autoFocus onClick={() => { focusRestoredChip.current = true; setChipVisible(true); }} variant="ghost">Restore chip</Button>}</div></form>
      <form noValidate onSubmit={(event) => { event.preventDefault(); setSubmission((current) => current + 1); }}>
        <Stack gap="md">
          <ValidationSummary errors={errors} focusKey={submission || undefined} id="catalog-errors" />
          <PasswordField autoComplete="new-password" error={passwordError} id="catalog-password" label="Password" minLength={12} name="catalog-password" onChange={(event) => setPassword(event.target.value)} required value={password} />
          <InputGroup addonDescription="US dollars" error={amountError} id="catalog-amount" inputMode="decimal" label="Amount" leading="$" name="catalog-amount" onChange={(event) => setAmount(event.target.value)} required trailing="USD" value={amount} />
          <Button type="submit" variant="secondary">Validate fields</Button>
        </Stack>
      </form>
      <Accordion defaultValue={["workspace"]} headingLevel={3} items={[
        { id: "workspace", title: "Workspace", content: "Changes stay local." },
        { id: "access", title: "Access", content: <Link href="#usage">Review permissions</Link> },
        { id: "archive", title: "Archive", content: "Saved work.", disabled: true }
      ]} />
      <Stepper aria-label="Publishing workflow" currentId={currentStep} items={[
        { id: "details", label: "Details" }, { id: "review", label: "Review" }, { id: "approve", label: "Approve" }, { id: "publish", label: "Publish", status: "error", disabled: true }
      ]} onStepChange={setCurrentStep} />
      <form aria-label="Experience rating" onSubmit={(event) => event.preventDefault()}><Rating defaultValue={3} label="Experience" name="catalog-rating" /></form>
    </Stack>
  </section>;
}
