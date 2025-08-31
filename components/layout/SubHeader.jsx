const SubHeader = ({ title }) => {
  return (
    <div
      className="flex items-center justify-between  dark:bg-slate-900
     dark:border-slate-700 mb-6"
    >
      <h1 className="text-primary sm:text-3xl  lg:text-4xl xl:text-5xl font-bold ">
        {title}
      </h1>
    </div>
  );
};

export default SubHeader;
