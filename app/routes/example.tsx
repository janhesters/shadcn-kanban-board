/* eslint-disable unicorn/no-null */
import { createId } from '@paralleldrive/cuid2';
import {
  MoreHorizontalIcon,
  PenIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import { useJsLoaded } from '@/new-york/hooks/use-js-loaded';
import type {
  KanbanBoardCircleColor,
  KanbanBoardDropDirection,
} from '@/new-york/ui/kanban';
import {
  KANBAN_BOARD_CIRCLE_COLORS,
  KanbanBoard,
  KanbanBoardCard,
  KanbanBoardCardButton,
  KanbanBoardCardButtonGroup,
  KanbanBoardCardDescription,
  KanbanBoardCardTextarea,
  KanbanBoardColumn,
  KanbanBoardColumnButton,
  kanbanBoardColumnClassNames,
  KanbanBoardColumnFooter,
  KanbanBoardColumnHeader,
  KanbanBoardColumnIconButton,
  KanbanBoardColumnList,
  KanbanBoardColumnListItem,
  kanbanBoardColumnListItemClassNames,
  KanbanBoardColumnSkeleton,
  KanbanBoardColumnTitle,
  KanbanBoardExtraMargin,
  KanbanBoardProvider,
  KanbanColorCircle,
  useDndEvents,
} from '@/new-york/ui/kanban';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { Input } from '~/components/ui/input';
import { Skeleton } from '~/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { Footer } from '~/features/landing/footer';
import { Header } from '~/features/landing/header';

// Types
type Card = {
  id: string;
  title: string;
};

type Column = {
  id: string;
  title: string;
  color: KanbanBoardCircleColor;
  items: Card[];
};

export default function KanbanBoardPage() {
  return (
    <div className="grid h-screen grid-rows-[var(--header-height)_1fr_6rem] overflow-x-hidden sm:grid-rows-[var(--header-height)_1fr_var(--header-height)]">
      <Header className="static box-border h-[var(--header-height)]" />

      <main className="relative">
        <div className="absolute inset-0 h-full overflow-x-hidden px-4 py-4 md:px-6">
          <KanbanBoardProvider>
            <MyKanbanBoard />
          </KanbanBoardProvider>
        </div>
      </main>

      <Footer className="h-24" />
    </div>
  );
}

export function MyKanbanBoard() {
  const [columns, setColumns] = useState<Column[]>([
    {
      id: 'eowdjiak9f9jr27po347jr47',
      title: 'Backlog',
      color: 'primary',
      items: [
        {
          id: '1',
          title: 'Add a new column',
        },
        {
          id: '2',
          title: 'Add a new card',
        },
        {
          id: '3',
          title: 'Move a card to another column',
        },
        {
          id: '4',
          title: 'Delete a column',
        },
        {
          id: '5',
          title: 'Delete a card',
        },
        {
          id: '6',
          title: 'Update a card title',
        },
        {
          id: '7',
          title: 'Edit a column title',
        },
        {
          id: '7',
          title: `Check out

multi line

card content`,
        },
        {
          id: '9',
          title: 'Move a card between two other cards',
        },
        {
          id: '10',
          title: 'Turn on screen reader and listen to the announcements',
        },
        {
          id: '11',
          title: 'Notice how with enough cards, the colomns become scrollable',
        },
      ],
    },
    {
      id: 'ad1wx5djclsilpu8sjmp9g70',
      title: 'To Do',
      color: 'blue',
      items: [
        {
          id: '12',
          title: 'Install the Shadcn Kanban board into your project',
        },
        {
          id: '13',
          title: 'Build amazing apps',
        },
      ],
    },
    {
      id: 'zm3vyxyo0x47tl60340w8jrl',
      title: 'In Progress',
      color: 'red',
      items: [
        {
          id: '14',
          title: 'Make some magic',
        },
        {
          id: '15',
          title: 'Stay healthy',
        },
        {
          id: '16',
          title: 'Drink water 💧',
        },
      ],
    },
    {
      id: 'rzaksqoyfvgjbw466puqu9uk',
      title: 'In Review',
      color: 'yellow',
      items: [],
    },
    {
      id: 'w27comaw16gy2jxphpmt9xxv',
      title: 'Done',
      color: 'green',
      items: [
        {
          id: '17',
          title: 'Hey, the column to the left of me is empty!',
        },
        {
          id: '18',
          title:
            'And using the button to the right of me, you can add columns.',
        },
      ],
    },
  ]);

  // Scroll to the right when a new column is added.
  const scrollContainerReference = useRef<HTMLDivElement>(null);

  function scrollRight() {
    if (scrollContainerReference.current) {
      scrollContainerReference.current.scrollLeft =
        scrollContainerReference.current.scrollWidth;
    }
  }

  /*
  Column logic
  */

  const handleAddColumn = (title?: string) => {
    if (title) {
      flushSync(() => {
        setColumns(previousColumns => [
          ...previousColumns,
          {
            id: createId(),
            title,
            color:
              KANBAN_BOARD_CIRCLE_COLORS[previousColumns.length] ?? 'primary',
            items: [],
          },
        ]);
      });
    }

    scrollRight();
  };

  function handleDeleteColumn(columnId: string) {
    flushSync(() => {
      setColumns(previousColumns =>
        previousColumns.filter(column => column.id !== columnId),
      );
    });

    scrollRight();
  }

  function handleUpdateColumnTitle(columnId: string, title: string) {
    setColumns(previousColumns =>
      previousColumns.map(column =>
        column.id === columnId ? { ...column, title } : column,
      ),
    );
  }

  /*
  Card logic
  */

  function handleAddCard(columnId: string, cardContent: string) {
    setColumns(previousColumns =>
      previousColumns.map(column =>
        column.id === columnId
          ? {
              ...column,
              items: [...column.items, { id: createId(), title: cardContent }],
            }
          : column,
      ),
    );
  }

  function handleDeleteCard(cardId: string) {
    setColumns(previousColumns =>
      previousColumns.map(column =>
        column.items.some(card => card.id === cardId)
          ? { ...column, items: column.items.filter(({ id }) => id !== cardId) }
          : column,
      ),
    );
  }

  function handleMoveCardToColumn(columnId: string, index: number, card: Card) {
    setColumns(previousColumns =>
      previousColumns.map(column => {
        if (column.id === columnId) {
          // Remove the card from the column (if it exists) before reinserting it.
          const updatedItems = column.items.filter(({ id }) => id !== card.id);
          return {
            ...column,
            items: [
              // Items before the insertion index.
              ...updatedItems.slice(0, index),
              // Insert the card.
              card,
              // Items after the insertion index.
              ...updatedItems.slice(index),
            ],
          };
        } else {
          // Remove the card from other columns.
          return {
            ...column,
            items: column.items.filter(({ id }) => id !== card.id),
          };
        }
      }),
    );
  }

  function handleUpdateCardTitle(cardId: string, cardTitle: string) {
    setColumns(previousColumns =>
      previousColumns.map(column =>
        column.items.some(card => card.id === cardId)
          ? {
              ...column,
              items: column.items.map(card =>
                card.id === cardId ? { ...card, title: cardTitle } : card,
              ),
            }
          : column,
      ),
    );
  }

  /*
  Moving cards with the keyboard.
  */
  const [activeCardId, setActiveCardId] = useState<string>('');
  const originalCardPositionReference = useRef<{
    columnId: string;
    cardIndex: number;
  } | null>(null);
  const { onDragStart, onDragEnd, onDragCancel, onDragOver } = useDndEvents();

  // This helper returns the appropriate overId after a card is placed.
  // If there's another card below, return that card's id, otherwise return the column's id.
  function getOverId(column: Column, cardIndex: number): string {
    if (cardIndex < column.items.length - 1) {
      return column.items[cardIndex + 1].id;
    }

    return column.id;
  }

  // Find column and index for a given card.
  function findCardPosition(cardId: string): {
    columnIndex: number;
    cardIndex: number;
  } {
    for (const [columnIndex, column] of columns.entries()) {
      const cardIndex = column.items.findIndex(c => c.id === cardId);

      if (cardIndex !== -1) {
        return { columnIndex, cardIndex };
      }
    }

    return { columnIndex: -1, cardIndex: -1 };
  }

  function moveActiveCard(
    cardId: string,
    direction: 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown',
  ) {
    const { columnIndex, cardIndex } = findCardPosition(cardId);
    if (columnIndex === -1 || cardIndex === -1) return;

    const card = columns[columnIndex].items[cardIndex];

    let newColumnIndex = columnIndex;
    let newCardIndex = cardIndex;

    switch (direction) {
      case 'ArrowUp': {
        newCardIndex = Math.max(cardIndex - 1, 0);

        break;
      }
      case 'ArrowDown': {
        newCardIndex = Math.min(
          cardIndex + 1,
          columns[columnIndex].items.length - 1,
        );

        break;
      }
      case 'ArrowLeft': {
        newColumnIndex = Math.max(columnIndex - 1, 0);
        // Keep same cardIndex if possible, or if out of range, insert at end
        newCardIndex = Math.min(
          newCardIndex,
          columns[newColumnIndex].items.length,
        );

        break;
      }
      case 'ArrowRight': {
        newColumnIndex = Math.min(columnIndex + 1, columns.length - 1);
        newCardIndex = Math.min(
          newCardIndex,
          columns[newColumnIndex].items.length,
        );

        break;
      }
    }

    // Perform state update in flushSync to ensure immediate state update.
    flushSync(() => {
      handleMoveCardToColumn(columns[newColumnIndex].id, newCardIndex, card);
    });

    // Find the card's new position and announce it.
    const { columnIndex: updatedColumnIndex, cardIndex: updatedCardIndex } =
      findCardPosition(cardId);
    const overId = getOverId(columns[updatedColumnIndex], updatedCardIndex);

    onDragOver(cardId, overId);
  }

  function handleCardKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    cardId: string,
  ) {
    const { key } = event;

    if (activeCardId === '' && key === ' ') {
      // Pick up the card.
      event.preventDefault();
      setActiveCardId(cardId);
      onDragStart(cardId);

      const { columnIndex, cardIndex } = findCardPosition(cardId);
      originalCardPositionReference.current =
        columnIndex !== -1 && cardIndex !== -1
          ? { columnId: columns[columnIndex].id, cardIndex }
          : null;
    } else if (activeCardId === cardId) {
      // Card is already active.
      // eslint-disable-next-line unicorn/prefer-switch
      if (key === ' ' || key === 'Enter') {
        event.preventDefault();
        // Drop the card.
        flushSync(() => {
          setActiveCardId('');
        });

        const { columnIndex, cardIndex } = findCardPosition(cardId);
        if (columnIndex !== -1 && cardIndex !== -1) {
          const overId = getOverId(columns[columnIndex], cardIndex);
          onDragEnd(cardId, overId);
        } else {
          // If we somehow can't find the card, just call onDragEnd with cardId.
          onDragEnd(cardId);
        }

        originalCardPositionReference.current = null;
      } else if (key === 'Escape') {
        event.preventDefault();

        // Cancel the drag.
        if (originalCardPositionReference.current) {
          const { columnId, cardIndex } = originalCardPositionReference.current;
          const {
            columnIndex: currentColumnIndex,
            cardIndex: currentCardIndex,
          } = findCardPosition(cardId);

          // Revert card only if it moved.
          if (
            currentColumnIndex !== -1 &&
            (columnId !== columns[currentColumnIndex].id ||
              cardIndex !== currentCardIndex)
          ) {
            const card = columns[currentColumnIndex].items[currentCardIndex];
            flushSync(() => {
              handleMoveCardToColumn(columnId, cardIndex, card);
            });
          }
        }

        onDragCancel(cardId);
        originalCardPositionReference.current = null;

        setActiveCardId('');
      } else if (
        key === 'ArrowLeft' ||
        key === 'ArrowRight' ||
        key === 'ArrowUp' ||
        key === 'ArrowDown'
      ) {
        event.preventDefault();
        moveActiveCard(cardId, key);
        // onDragOver is called inside moveActiveCard after placement.
      }
    }
  }

  function handleCardBlur() {
    setActiveCardId('');
  }

  const jsLoaded = useJsLoaded();

  return (
    <KanbanBoard ref={scrollContainerReference}>
      {columns.map(column =>
        jsLoaded ? (
          <MyKanbanBoardColumn
            activeCardId={activeCardId}
            column={column}
            key={column.id}
            onAddCard={handleAddCard}
            onCardBlur={handleCardBlur}
            onCardKeyDown={handleCardKeyDown}
            onDeleteCard={handleDeleteCard}
            onDeleteColumn={handleDeleteColumn}
            onMoveCardToColumn={handleMoveCardToColumn}
            onUpdateCardTitle={handleUpdateCardTitle}
            onUpdateColumnTitle={handleUpdateColumnTitle}
          />
        ) : (
          <KanbanBoardColumnSkeleton key={column.id} />
        ),
      )}

      {/* Add a new column */}
      {jsLoaded ? (
        <MyNewKanbanBoardColumn onAddColumn={handleAddColumn} />
      ) : (
        <Skeleton className="h-9 w-10.5 flex-shrink-0" />
      )}

      <KanbanBoardExtraMargin />
    </KanbanBoard>
  );
}

function MyKanbanBoardColumn({
  activeCardId,
  column,
  onAddCard,
  onCardBlur,
  onCardKeyDown,
  onDeleteCard,
  onDeleteColumn,
  onMoveCardToColumn,
  onUpdateCardTitle,
  onUpdateColumnTitle,
}: {
  activeCardId: string;
  column: Column;
  onAddCard: (columnId: string, cardContent: string) => void;
  onCardBlur: () => void;
  onCardKeyDown: (
    event: KeyboardEvent<HTMLButtonElement>,
    cardId: string,
  ) => void;
  onDeleteCard: (cardId: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onMoveCardToColumn: (columnId: string, index: number, card: Card) => void;
  onUpdateCardTitle: (cardId: string, cardTitle: string) => void;
  onUpdateColumnTitle: (columnId: string, columnTitle: string) => void;
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const listReference = useRef<HTMLUListElement>(null);
  const moreOptionsButtonReference = useRef<HTMLButtonElement>(null);
  const { onDragCancel, onDragEnd } = useDndEvents();

  function scrollList() {
    if (listReference.current) {
      listReference.current.scrollTop = listReference.current.scrollHeight;
    }
  }

  function closeDropdownMenu() {
    flushSync(() => {
      setIsEditingTitle(false);
    });

    moreOptionsButtonReference.current?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const columnTitle = formData.get('columnTitle') as string;
    onUpdateColumnTitle(column.id, columnTitle);
    closeDropdownMenu();
  }

  function handleDropOverColumn(dataTransferData: string) {
    const card = JSON.parse(dataTransferData) as Card;
    onMoveCardToColumn(column.id, 0, card);
  }

  function handleDropOverListItem(cardId: string) {
    return (
      dataTransferData: string,
      dropDirection: KanbanBoardDropDirection,
    ) => {
      const card = JSON.parse(dataTransferData) as Card;
      const cardIndex = column.items.findIndex(({ id }) => id === cardId);
      const currentCardIndex = column.items.findIndex(
        ({ id }) => id === card.id,
      );

      const baseIndex = dropDirection === 'top' ? cardIndex : cardIndex + 1;
      const targetIndex =
        currentCardIndex !== -1 && currentCardIndex < baseIndex
          ? baseIndex - 1
          : baseIndex;

      // Safety check to ensure targetIndex is within bounds
      const safeTargetIndex = Math.max(
        0,
        Math.min(targetIndex, column.items.length),
      );
      const overCard = column.items[safeTargetIndex];

      if (card.id === overCard?.id) {
        onDragCancel(card.id);
      } else {
        onMoveCardToColumn(column.id, safeTargetIndex, card);
        onDragEnd(card.id, overCard?.id || column.id);
      }
    };
  }

  return (
    <KanbanBoardColumn
      columnId={column.id}
      key={column.id}
      onDropOverColumn={handleDropOverColumn}
    >
      <KanbanBoardColumnHeader>
        {isEditingTitle ? (
          <form
            className="w-full"
            onSubmit={handleSubmit}
            onBlur={event => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                closeDropdownMenu();
              }
            }}
          >
            <Input
              aria-label="Column title"
              autoFocus
              defaultValue={column.title}
              name="columnTitle"
              onKeyDown={event => {
                if (event.key === 'Escape') {
                  closeDropdownMenu();
                }
              }}
              required
            />
          </form>
        ) : (
          <>
            <KanbanBoardColumnTitle columnId={column.id}>
              <KanbanColorCircle color={column.color} />
              {column.title}
            </KanbanBoardColumnTitle>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <KanbanBoardColumnIconButton ref={moreOptionsButtonReference}>
                  <MoreHorizontalIcon />

                  <span className="sr-only">
                    More options for {column.title}
                  </span>
                </KanbanBoardColumnIconButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Column</DropdownMenuLabel>

                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
                    <PenIcon />
                    Edit Details
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDeleteColumn(column.id)}
                  >
                    <Trash2Icon />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </KanbanBoardColumnHeader>

      <KanbanBoardColumnList ref={listReference}>
        {column.items.map(card => (
          <KanbanBoardColumnListItem
            cardId={card.id}
            key={card.id}
            onDropOverListItem={handleDropOverListItem(card.id)}
          >
            <MyKanbanBoardCard
              card={card}
              isActive={activeCardId === card.id}
              onCardBlur={onCardBlur}
              onCardKeyDown={onCardKeyDown}
              onDeleteCard={onDeleteCard}
              onUpdateCardTitle={onUpdateCardTitle}
            />
          </KanbanBoardColumnListItem>
        ))}
      </KanbanBoardColumnList>

      <MyNewKanbanBoardCard
        column={column}
        onAddCard={onAddCard}
        scrollList={scrollList}
      />
    </KanbanBoardColumn>
  );
}

function MyKanbanBoardCard({
  card,
  isActive,
  onCardBlur,
  onCardKeyDown,
  onDeleteCard,
  onUpdateCardTitle,
}: {
  card: Card;
  isActive: boolean;
  onCardBlur: () => void;
  onCardKeyDown: (
    event: KeyboardEvent<HTMLButtonElement>,
    cardId: string,
  ) => void;
  onDeleteCard: (cardId: string) => void;
  onUpdateCardTitle: (cardId: string, cardTitle: string) => void;
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const kanbanBoardCardReference = useRef<HTMLButtonElement>(null);
  // This ref tracks the previous `isActive` state. It is used to refocus the
  // card after it was discarded with the keyboard.
  const previousIsActiveReference = useRef(isActive);
  // This ref tracks if the card was cancelled via Escape.
  const wasCancelledReference = useRef(false);

  useEffect(() => {
    // Maintain focus after the card is picked up and moved.
    if (isActive && !isEditingTitle) {
      kanbanBoardCardReference.current?.focus();
    }

    // Refocus the card after it was discarded with the keyboard.
    if (
      !isActive &&
      previousIsActiveReference.current &&
      wasCancelledReference.current
    ) {
      kanbanBoardCardReference.current?.focus();
      wasCancelledReference.current = false;
    }

    previousIsActiveReference.current = isActive;
  }, [isActive, isEditingTitle]);

  function handleBlur() {
    flushSync(() => {
      setIsEditingTitle(false);
    });

    kanbanBoardCardReference.current?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const cardTitle = formData.get('cardTitle') as string;
    onUpdateCardTitle(card.id, cardTitle);
    handleBlur();
  }

  return isEditingTitle ? (
    <form onBlur={handleBlur} onSubmit={handleSubmit}>
      <KanbanBoardCardTextarea
        aria-label="Edit card title"
        autoFocus
        defaultValue={card.title}
        name="cardTitle"
        onFocus={event => event.target.select()}
        onInput={event => {
          const input = event.currentTarget as HTMLTextAreaElement;
          if (/\S/.test(input.value)) {
            // Clear the error message if input is valid
            input.setCustomValidity('');
          } else {
            input.setCustomValidity(
              'Card content cannot be empty or just whitespace.',
            );
          }
        }}
        onKeyDown={event => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }

          if (event.key === 'Escape') {
            handleBlur();
          }
        }}
        placeholder="Edit card title ..."
        required
      />
    </form>
  ) : (
    <KanbanBoardCard
      data={card}
      isActive={isActive}
      onBlur={onCardBlur}
      onClick={() => setIsEditingTitle(true)}
      onKeyDown={event => {
        if (event.key === ' ') {
          // Prevent the button "click" action on space because that should
          // be used to pick up and move the card using the keyboard.
          event.preventDefault();
        }

        if (event.key === 'Escape') {
          // Mark that this card was cancelled.
          wasCancelledReference.current = true;
        }

        onCardKeyDown(event, card.id);
      }}
      ref={kanbanBoardCardReference}
    >
      <KanbanBoardCardDescription>{card.title}</KanbanBoardCardDescription>
      <KanbanBoardCardButtonGroup disabled={isActive}>
        <KanbanBoardCardButton
          className="text-destructive"
          onClick={() => onDeleteCard(card.id)}
          tooltip="Delete card"
        >
          <Trash2Icon />

          <span className="sr-only">Delete card</span>
        </KanbanBoardCardButton>
      </KanbanBoardCardButtonGroup>
    </KanbanBoardCard>
  );
}

function MyNewKanbanBoardCard({
  column,
  onAddCard,
  scrollList,
}: {
  column: Column;
  onAddCard: (columnId: string, cardContent: string) => void;
  scrollList: () => void;
}) {
  const [cardContent, setCardContent] = useState('');
  const newCardButtonReference = useRef<HTMLButtonElement>(null);
  const submitButtonReference = useRef<HTMLButtonElement>(null);
  const [showNewCardForm, setShowNewCardForm] = useState(false);

  function handleAddCardClick() {
    flushSync(() => {
      setShowNewCardForm(true);
    });

    scrollList();
  }

  function handleCancelClick() {
    flushSync(() => {
      setShowNewCardForm(false);
      setCardContent('');
    });

    newCardButtonReference.current?.focus();
  }

  function handleInputChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setCardContent(event.currentTarget.value);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    flushSync(() => {
      onAddCard(column.id, cardContent.trim());
      setCardContent('');
    });

    scrollList();
  }

  return showNewCardForm ? (
    <>
      <form
        onBlur={event => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            handleCancelClick();
          }
        }}
        onSubmit={handleSubmit}
      >
        <div className={kanbanBoardColumnListItemClassNames}>
          <KanbanBoardCardTextarea
            aria-label="New card content"
            autoFocus
            name="cardContent"
            onChange={handleInputChange}
            onInput={event => {
              const input = event.currentTarget as HTMLTextAreaElement;
              if (/\S/.test(input.value)) {
                // Clear the error message if input is valid
                input.setCustomValidity('');
              } else {
                input.setCustomValidity(
                  'Card content cannot be empty or just whitespace.',
                );
              }
            }}
            onKeyDown={event => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                submitButtonReference.current?.click();
              }

              if (event.key === 'Escape') {
                handleCancelClick();
              }
            }}
            placeholder="New post ..."
            required
            value={cardContent}
          />
        </div>

        <KanbanBoardColumnFooter>
          <Button ref={submitButtonReference} size="sm" type="submit">
            Add
          </Button>

          <Button
            onClick={handleCancelClick}
            size="sm"
            variant="outline"
            type="button"
          >
            Cancel
          </Button>
        </KanbanBoardColumnFooter>
      </form>
    </>
  ) : (
    <KanbanBoardColumnFooter>
      <KanbanBoardColumnButton
        onClick={handleAddCardClick}
        ref={newCardButtonReference}
      >
        <PlusIcon />

        <span aria-hidden>New card</span>

        <span className="sr-only">Add new card to {column.title}</span>
      </KanbanBoardColumnButton>
    </KanbanBoardColumnFooter>
  );
}

function MyNewKanbanBoardColumn({
  onAddColumn,
}: {
  onAddColumn: (columnTitle?: string) => void;
}) {
  const [showEditor, setShowEditor] = useState(false);
  const newColumnButtonReference = useRef<HTMLButtonElement>(null);
  const inputReference = useRef<HTMLInputElement>(null);

  function handleAddColumnClick() {
    flushSync(() => {
      setShowEditor(true);
    });

    onAddColumn();
  }

  function handleCancelClick() {
    flushSync(() => {
      setShowEditor(false);
    });

    newColumnButtonReference.current?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const columnTitle = formData.get('columnTitle') as string;
    onAddColumn(columnTitle);
    if (inputReference.current) {
      inputReference.current.value = '';
    }
  }

  return showEditor ? (
    <form
      className={kanbanBoardColumnClassNames}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          handleCancelClick();
        }
      }}
      onSubmit={handleSubmit}
    >
      <KanbanBoardColumnHeader>
        <Input
          aria-label="Column title"
          autoFocus
          name="columnTitle"
          onKeyDown={event => {
            if (event.key === 'Escape') {
              handleCancelClick();
            }
          }}
          placeholder="New column title ..."
          ref={inputReference}
          required
        />
      </KanbanBoardColumnHeader>

      <KanbanBoardColumnFooter>
        <Button size="sm" type="submit">
          Add
        </Button>

        <Button
          onClick={handleCancelClick}
          size="sm"
          type="button"
          variant="outline"
        >
          Cancel
        </Button>
      </KanbanBoardColumnFooter>
    </form>
  ) : (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={handleAddColumnClick}
          ref={newColumnButtonReference}
          variant="outline"
        >
          <PlusIcon />

          <span className="sr-only">Add column</span>
        </Button>
      </TooltipTrigger>

      <TooltipContent>Add a new column to the board</TooltipContent>
    </Tooltip>
  );
}
