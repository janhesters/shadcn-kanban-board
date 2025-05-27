import { Slot } from '@radix-ui/react-slot';
import { ImageIcon } from 'lucide-react';
import type { ComponentProps, PropsWithChildren } from 'react';
import { createContext, useContext } from 'react';
import type { DropzoneOptions, DropzoneState } from 'react-dropzone';
import { useDropzone } from 'react-dropzone';

import { cn } from '~/lib/utils';

const DragAndDropContext = createContext<
  (DropzoneState & Pick<DropzoneOptions, 'accept' | 'disabled'>) | null
  // eslint-disable-next-line unicorn/no-null
>(null);

function useDragAndDropContext() {
  const context = useContext(DragAndDropContext);

  if (!context) {
    throw new Error(
      'useDragAndDropContext must be used within a DragAndDropProvider',
    );
  }

  return context;
}

export function DragAndDropProvider({
  accept,
  children,
  disabled,
  ...props
}: PropsWithChildren<DropzoneOptions>) {
  const dragAndDropProps = useDropzone({ accept, disabled, ...props });

  return (
    <DragAndDropContext.Provider
      value={{
        accept,
        disabled,
        ...dragAndDropProps,
      }}
    >
      {children}
    </DragAndDropContext.Provider>
  );
}

type DragAndDropProps = ComponentProps<'input'> & {
  isInvalid?: boolean;
};

export function DragAndDrop({
  className,
  children,
  isInvalid,
  ...props
}: DragAndDropProps) {
  const { disabled, getRootProps, getInputProps, isDragActive } =
    useDragAndDropContext();

  return (
    <div
      {...getRootProps({
        className: cn(
          'border-input bg-transparent dark:bg-input/30 border px-3 py-4 rounded-md border-dashed text-center shadow-xs',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none',
          isDragActive && 'border-primary bg-primary/10 dark:bg-primary/10',
          disabled && 'pointer-events-none cursor-not-allowed opacity-50',
          isInvalid &&
            'border-destructive bg-destructive/10 dark:bg-destructive/10',
          className,
        ),
      })}
    >
      <input {...getInputProps({ disabled, ...props })} />

      {children}
    </div>
  );
}

export function DragAndDropContent({
  className,
  ...props
}: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-y-1', className)} {...props} />;
}

export function DragAndDropIcon({
  className,
  asChild,
  ...props
}: ComponentProps<typeof ImageIcon> & {
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot : ImageIcon;
  const { acceptedFiles } = useDragAndDropContext();
  const hasFiles = acceptedFiles.length > 0;

  return (
    // @ts-expect-error TypeScript doesn't know that the props will fit the
    // LucideIcon type
    <Comp
      className={cn(
        'size-10',
        hasFiles ? 'text-primary' : 'text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

export function DragAndDropSelectedFiles() {
  const { acceptedFiles } = useDragAndDropContext();

  return (
    <div className="text-muted-foreground text-sm">
      {acceptedFiles.map(file => file.name).join(', ')}
    </div>
  );
}

export function DrapAndDropButton({
  className,
  ...props
}: ComponentProps<'button'>) {
  const { open } = useDragAndDropContext();

  return (
    <button
      className={cn(
        'text-primary hover:text-primary/90 dark:text-foreground dark:hover:text-primary/90 cursor-pointer underline transition',
        className,
      )}
      onClick={open}
      tabIndex={-1}
      type="button"
      {...props}
    />
  );
}

export function DragAndDropHeading({
  className,
  ...props
}: ComponentProps<'p'>) {
  return <p className={cn('text-muted-foreground', className)} {...props} />;
}

export function DragAndDropDescription({
  className,
  ...props
}: ComponentProps<'p'>) {
  return (
    <p className={cn('text-muted-foreground text-xs', className)} {...props} />
  );
}
