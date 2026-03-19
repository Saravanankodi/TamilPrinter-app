import { CardProps } from '@/types'

const Card = ({label,icon,disc,value}:CardProps) => {
  return (
    <>
    <section className="w-full h-auto p-6 bg-white rounded-lg border-[1px_solid_#00000014] shadow-[0px_2px_4px_-1px_#00000008_0px_4px_6px_-1px_#0000000D]">
        <aside className="w-full h-auto flex">
            <p className="text-base">
                {label}
            </p>
            <div className="w-8 h-8 rounded-md">
                {icon}
            </div>
        </aside>
        <h4 className="text-[28px] text-[#0F172A] font-bold  ">
            {value}
        </h4>
        <p className="text-base">
            {disc}
        </p>
    </section>
    </>
  )
}

export default Card