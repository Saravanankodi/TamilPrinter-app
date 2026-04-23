import { CardProps } from '@/types'

const Card = ({label,icon,disc,value,color}:CardProps) => {
  return (
    <>
    <section className="w-full max-w-65 max-h-35 p-6 bg-white rounded-lg border border-[#00000014] shadow-[0px_2px_4px_-1px_#00000008_0px_4px_6px_-1px_#0000000D] m-auto">
        <aside className="w-full h-auto flex justify-between">
            <p className="text-sm text-[#667085] font-medium ">
                {label}
            </p>
            {
                icon && (
                    <div className="w-8 h-8 rounded-md">
                        {icon}
                    </div>
                )
            }
        </aside>
        <h4 className="text-[28px] text-[#0F172A] font-bold  ">
            {value}
        </h4>
        <p className="text-xs font-normal" style={{color:color}}>
            {disc}
        </p>
    </section>
    </>
  )
}

export default Card