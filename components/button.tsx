import { KeyboardEventHandler, MouseEventHandler, Ref } from "react";

export interface ButtonProps {
  onClick?: MouseEventHandler<HTMLButtonElement>;
  onKeyDownCapture?: KeyboardEventHandler<HTMLButtonElement>;
  isLoading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  className?: string;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'normal' | 'danger' | 'warn' | 'ghost';
  accessKey?: string;
  autoFocus?: boolean;
  buttonRef?: Ref<HTMLButtonElement>;
}
export default function Button(props: React.PropsWithChildren<ButtonProps>) {

  return (
    <button
      ref={props.buttonRef}
      autoFocus={props.autoFocus}
      title={props.title}
      disabled={props.disabled || props.isLoading}
      accessKey={props.accessKey}
      className={`${
        props.disabled || props.isLoading ? "bg-gray-300 dark:bg-gray-700 hover:bg-gray-300 focus:outline-none disabled:opacity-50" : ""
      } ${
        props.className || ""
      }  transition  duration-50
      ${(props.size === 'sm') ?  'h-6 px-1 py-1 xl:px-1 xl:py-1 text-xs' : ''}
      ${(props.size == null || props.size === 'md') ?  'h-8 px-2 py-1 xl:px-3 xl:py-2 text-sm font-semibold' : ''}
      ${(props.size === 'lg') ?  'h-816 px-3 py-2 xl:px-4 xl:py-3 text-md font-semibold' : ''}
      ${(props.variant == null || props.variant === 'normal') ?  'hover:bg-blue-200 border dark:border-slate-700 hover:bg-primary-500  dark:hover:bg-blue-700' : ''}
      ${(props.variant === 'danger') ?  ' text-red-600 hover:bg-red-500 border border-red-600/20 hover:border-red-700 hover:text-white' : ''}
      ${(props.variant === 'ghost') ?  'hover:bg-blue-200 hover:bg-primary-500  dark:hover:bg-blue-700 ' : ''}
      rounded-md hover:no-underline inline-flex items-center justify-center  `}
      onClick={props.onClick}
      onKeyDownCapture={props.onKeyDownCapture}
    >
      {props.isLoading && (
          <div className="flex justify-center items-center gap-1">
              <svg
              className="animate-spin w-4 h-4"
                width="32mm"
                height="32mm"
                version="1.1"
                viewBox="0 0 32 32"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g transform="translate(-74.019 -55.434)">
                  <path
                    d="m90.019 55.434a16 16 0 0 0-16 16 16 16 0 0 0 16 16 16 16 0 0 0 16-16 16 16 0 0 0-16-16zm0 3.0837a12.729 12.916 0 0 1 12.729 12.916 12.729 12.916 0 0 1-12.729 12.916 12.729 12.916 0 0 1-12.73-12.916 12.729 12.916 0 0 1 12.73-12.916z"
                    style={{ fill: "#000",fillOpacity:".47703", strokeWidth: "1.8368" }}
                  />
                  <path
                    d="m90.019 55.434a16 16 0 0 0-16 16h3.2706a12.729 12.916 0 0 1 12.729-12.917z"
                    style={{ fill: "#000", strokeWidth: "1.8368" }}
                  />
                </g>
              </svg>
              <div>
              {props.loadingText || "Loading..."}
              </div>
          <div>
            </div>
        </div>
      )}
      <div>{!props.isLoading && props.children}</div>
    </button>
  );
}
