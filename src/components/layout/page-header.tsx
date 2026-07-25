type PageHeaderProps = {
  title: string;
  description?: string;
};

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="border-b border-dark/8 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="max-w-2xl animate-fade-in-up space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-dark sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="text-base leading-7 text-muted sm:text-lg">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
